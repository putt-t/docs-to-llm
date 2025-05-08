from typing import Union, Dict, List
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Body, Query
from pydantic import BaseModel
from contextlib import asynccontextmanager
import crawl4ai
from crawl4ai import AsyncWebCrawler, CrawlerRunConfig, CacheMode
import os
from dotenv import load_dotenv
from google import genai
load_dotenv()


crawler = None

class UrlsRequest(BaseModel):
    urls: List[str]
    clean_output: bool = False

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize resources on startup
    global crawler
    crawler = crawl4ai.AsyncWebCrawler()
    yield
    # Clean up resources on shutdown
    if crawler is not None:
        await crawler.close()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],  
)

async def _clean_markdown_with_llm(markdown_content: str) -> str:
    if not genai:
        return markdown_content

    try:

        client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

        prompt = f"""You are an expert text cleaner. Given the following markdown content from a crawled webpage, 
                    please remove all irrelevant information such as license details, footers, navigation bars, sponsor messages,
                    and any other non-essential content. Focus on preserving the main programming documentation. 
                    Return only the cleaned markdown. Here is the markdown:
                    {markdown_content}"""
        
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
        )
        
        cleaned_text = response.text

        if cleaned_text.startswith("```markdown\n"):
            cleaned_text = cleaned_text[len("```markdown\n"):]
        elif cleaned_text.startswith("```markdown"):
            cleaned_text = cleaned_text[len("```markdown"):]
        
        if cleaned_text.endswith("\n```"):
            cleaned_text = cleaned_text[:-len("\n```")]
        elif cleaned_text.endswith("```"):
            cleaned_text = cleaned_text[:-len("```")]
        
        return cleaned_text
    except Exception as e:
        print(f"Error during LLM cleaning: {e}. Returning original markdown.")
        return markdown_content

@app.get("/crawl-single-url")
async def crawl_single_url(url: str, clean_output: bool = Query(False)):
    global crawler
    if crawler is None:
        return {"success": False, "message": "Crawler not initialized"}
    try:
        run_config = CrawlerRunConfig(
            exclude_external_links=True,
            exclude_internal_links=True,
            cache_mode=CacheMode.BYPASS,
            check_robots_txt=True,
            exclude_all_images=True,
            exclude_social_media_links=True
        )

        result = await crawler.arun(url=url, config=run_config)
        original_markdown = result.markdown
        cleaned_markdown = None

        if clean_output:
            cleaned_markdown = await _clean_markdown_with_llm(original_markdown)

        return {
            "success": True, 
            "original_markdown": original_markdown, 
            "cleaned_markdown": cleaned_markdown, 
            "message": "Crawling successful"
        }
    except Exception as e:
        return {"success": False, "message": "Crawling failed", "error": str(e)}

@app.post("/crawl-specific-urls")
async def crawl_specific_urls(request: UrlsRequest):
    global crawler
    if crawler is None:
        return {"success": False, "message": "Crawler not initialized"}
    try:
       ...
    except Exception as e:
        return {"success": False, "message": "Crawling specific URLs failed", "error": str(e)}

@app.get("/crawl-whole-documentation")
async def crawl_whole_documentation(url: str, max_pages: int = Query(20), clean_output: bool = Query(False)):
    global crawler
    if crawler is None:
        return {"success": False, "message": "Crawler not initialized"}
    try:
        ...
    except Exception as e:
        return {"success": False, "message": "Crawling whole documentation failed", "error": str(e)}

