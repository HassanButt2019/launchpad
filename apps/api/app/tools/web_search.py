"""
Tavily Search API wrapper for the market research agent.
Returns a list of {title, url, content, score} dicts.
Falls back to empty list when TAVILY_API_KEY is not set.
"""
import logging
from typing import List, Dict, Any

import httpx

logger = logging.getLogger(__name__)

_TAVILY_URL = "https://api.tavily.com/search"


async def tavily_search(
    query: str,
    api_key: str,
    max_results: int = 5,
) -> List[Dict[str, Any]]:
    """Call Tavily and return up to max_results results."""
    if not api_key:
        return []
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            res = await client.post(
                _TAVILY_URL,
                json={
                    "api_key": api_key,
                    "query": query,
                    "search_depth": "basic",
                    "max_results": max_results,
                    "include_answer": False,
                    "include_raw_content": False,
                },
            )
            res.raise_for_status()
            data = res.json()
            results = data.get("results", [])
            return [
                {
                    "title":   r.get("title", ""),
                    "url":     r.get("url", ""),
                    "content": r.get("content", "")[:600],  # trim to save tokens
                    "score":   r.get("score", 0),
                }
                for r in results
            ]
    except Exception as exc:
        logger.warning("Tavily search failed for '%s': %s", query, exc)
        return []
