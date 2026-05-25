import base64
import json
import os
from dataclasses import dataclass
from typing import Optional

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC


RSA_PREFIX = "rsa:v1:"


@dataclass(frozen=True)
class EncryptionContext:
    user_id: str
    salt: bytes
    master_secret: str
    rsa_private_key_base64: str


def derive_user_key(user_id: str, salt: bytes, master_secret: str) -> bytes:
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=390000,
    )
    key_material = (master_secret + user_id).encode("utf-8")
    derived = kdf.derive(key_material)
    return base64.urlsafe_b64encode(derived)


def get_user_fernet(
    user_id: Optional[str] = None,
    salt: Optional[bytes] = None,
    master_secret: Optional[str] = None,
    rsa_private_key_base64: str = "",
) -> EncryptionContext:
    if user_id is None or salt is None or master_secret is None:
        # Compatibility for older call sites. Prefer passing all values.
        user_id = user_id or ""
        salt = salt or b""
        master_secret = master_secret or ""

    return EncryptionContext(
        user_id=str(user_id),
        salt=salt,
        master_secret=master_secret,
        rsa_private_key_base64=rsa_private_key_base64,
    )


def _load_private_key(private_key_base64: str) -> rsa.RSAPrivateKey:
    if not private_key_base64:
        raise ValueError("RSA_PRIVATE_KEY_BASE64 is required for encryption")

    private_key_pem = base64.b64decode(private_key_base64)
    private_key = serialization.load_pem_private_key(private_key_pem, password=None)
    if not isinstance(private_key, rsa.RSAPrivateKey):
        raise ValueError("RSA_PRIVATE_KEY_BASE64 must contain an RSA private key")
    return private_key


def _b64encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("utf-8")


def _b64decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value.encode("utf-8"))


def _legacy_decrypt(ciphertext: str, context: EncryptionContext) -> str:
    if not context.user_id or not context.salt or not context.master_secret:
        raise ValueError("Legacy Fernet context is incomplete")

    key = derive_user_key(context.user_id, context.salt, context.master_secret)
    return Fernet(key).decrypt(ciphertext.encode("utf-8")).decode("utf-8")


def encrypt_field(plaintext: str, context: EncryptionContext) -> str:
    private_key = _load_private_key(context.rsa_private_key_base64)
    public_key = private_key.public_key()

    data_key = AESGCM.generate_key(bit_length=256)
    nonce = os.urandom(12)
    ciphertext = AESGCM(data_key).encrypt(nonce, plaintext.encode("utf-8"), None)

    encrypted_key = public_key.encrypt(
        data_key,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None,
        ),
    )

    payload = {
        "ek": _b64encode(encrypted_key),
        "n": _b64encode(nonce),
        "ct": _b64encode(ciphertext),
    }
    packed = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    return f"{RSA_PREFIX}{_b64encode(packed)}"


def decrypt_field(ciphertext: str, context: EncryptionContext) -> str:
    if not ciphertext.startswith(RSA_PREFIX):
        return _legacy_decrypt(ciphertext, context)

    private_key = _load_private_key(context.rsa_private_key_base64)
    payload = json.loads(_b64decode(ciphertext[len(RSA_PREFIX):]).decode("utf-8"))
    data_key = private_key.decrypt(
        _b64decode(payload["ek"]),
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None,
        ),
    )

    plaintext = AESGCM(data_key).decrypt(
        _b64decode(payload["n"]),
        _b64decode(payload["ct"]),
        None,
    )
    return plaintext.decode("utf-8")


def generate_salt() -> bytes:
    return os.urandom(16)
