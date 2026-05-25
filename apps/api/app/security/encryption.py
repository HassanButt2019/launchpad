import base64
import os
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes


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


def get_user_fernet(user_id: str, salt: bytes, master_secret: str) -> Fernet:
    key = derive_user_key(user_id, salt, master_secret)
    return Fernet(key)


def encrypt_field(plaintext: str, fernet: Fernet) -> str:
    return fernet.encrypt(plaintext.encode("utf-8")).decode("utf-8")


def decrypt_field(ciphertext: str, fernet: Fernet) -> str:
    return fernet.decrypt(ciphertext.encode("utf-8")).decode("utf-8")


def generate_salt() -> bytes:
    return os.urandom(16)
