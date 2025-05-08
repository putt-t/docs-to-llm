"use client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { InfoIcon as InfoCircle, Flame, Copy, Check, Download } from "lucide-react"

import { useState, useEffect } from "react"

interface CrawlResult {
  success?: boolean;
  original_markdown?: string;
  cleaned_markdown?: string;
  message?: string;
  error?: string;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [crawlType, setCrawlType] = useState("single");
  const [specificUrls, setSpecificUrls] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CrawlResult | null>(null);
  const [cleanWithLLM, setCleanWithLLM] = useState(false);
  const [activeTab, setActiveTab] = useState<'original' | 'cleaned'>('original');
  const [outputDisplay, setOutputDisplay] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [showCopySuccessIcon, setShowCopySuccessIcon] = useState(false);

  useEffect(() => {
    if (result) {
      if (activeTab === 'cleaned' && result.cleaned_markdown) {
        setOutputDisplay(result.cleaned_markdown);
      } else {
        setOutputDisplay(result.original_markdown || JSON.stringify(result, null, 2));
      }
    } else {
      setOutputDisplay(null);
    }
  }, [result, activeTab]);

  const handleCrawl = async () => {
    setIsLoading(true);
    setResult(null);
    setActiveTab('original');
    setCopySuccess('');
    setInputError(null);

    if (!url.trim()) {
      setInputError("Please enter a URL.");
      setIsLoading(false);
      return;
    }

    try {
      let apiUrl = "";
      let options: RequestInit = {};
      let bodyParams: any = {};

      if (crawlType === "single") {
        apiUrl = `/api/crawl-single-url?url=${encodeURIComponent(url)}&clean_output=${cleanWithLLM}`;
      } else if (crawlType === "whole") {
        apiUrl = `/api/crawl-whole-documentation?url=${encodeURIComponent(url)}&max_pages=20&clean_output=${cleanWithLLM}`;
      } else if (crawlType === "specific") {
        apiUrl = '/api/crawl-specific-urls';
        const urlList = specificUrls.split("\n").filter(u => u.trim() !== "");
        bodyParams = { urls: urlList, clean_output: cleanWithLLM };
        options = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bodyParams),
        };
      }

      if (apiUrl) {
        const response = await fetch(apiUrl, options);
        const data: CrawlResult = await response.json();
        setResult(data);
        if (data.success) {
          setActiveTab('original');
          setOutputDisplay(data.original_markdown || '');
        } else {
          setOutputDisplay(JSON.stringify(data, null, 2));
        }
      }
    } catch (error) {
      console.error("Error crawling:", error);
      setResult({ success: false, error: "Client-side error during crawl.", message: "Failed to fetch" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (outputDisplay) {
      navigator.clipboard.writeText(outputDisplay).then(() => {
        setCopySuccess('Copied!');
        setShowCopySuccessIcon(true);
        setTimeout(() => {
          setCopySuccess('');
          setShowCopySuccessIcon(false);
        }, 2000);
      }, (err) => {
        setCopySuccess('Failed to copy!');
        setShowCopySuccessIcon(false);
        console.error('Failed to copy text: ', err);
      });
    }
  };

  const handleDownload = () => {
    if (outputDisplay) {
      const blob = new Blob([outputDisplay], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'markdown.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-background text-foreground">
      <div className="container max-w-4xl px-4 py-8 mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-6xl font-bold tracking-tighter text-primary mb-4">
            generate a md or download a txt version of the docs website you want
          </h2>
        </div>

        {/* Main input area */}
        <div className="bg-card rounded-xl p-8 mb-6 shadow-lg">
          <div className="mb-6">
            <Input
              type="url"
              placeholder="Enter a URL"
              className="bg-secondary border-border h-12 text-foreground placeholder:text-muted-foreground"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Crawling Options</h3>
            <RadioGroup value={crawlType} onValueChange={setCrawlType} className="space-y-3">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="single" id="single" />
                <Label htmlFor="single">Single Page</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="whole" id="whole" />
                <Label htmlFor="whole">Whole Documentation</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="specific" id="specific" />
                <Label htmlFor="specific">Specific URLs</Label>
              </div>
            </RadioGroup>
          </div>

          {crawlType === "specific" && (
            <div className="mb-6">
              <Label htmlFor="specificUrls" className="block mb-2">Enter URLs (one per line)</Label>
              <textarea
                id="specificUrls"
                className="w-full h-32 bg-secondary border-border rounded-md p-2 text-foreground placeholder:text-muted-foreground"
                placeholder="https://example.com/docs/page1&#10;https://example.com/docs/page2"
                value={specificUrls}
                onChange={(e) => setSpecificUrls(e.target.value)}
              />
            </div>
          )}

          <div className="flex items-center space-x-2 mb-6">
            <Switch
              id="clean-llm"
              checked={cleanWithLLM}
              onCheckedChange={setCleanWithLLM}
            />
            <Label htmlFor="clean-llm">Clean output with LLM</Label>
          </div>

          <div className="flex items-center justify-between mb-6">
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-2 h-10"
              onClick={handleCrawl}
              disabled={isLoading || !url.trim()}
            >
              {isLoading ? "Generating..." : "Generate"}
            </Button>
          </div>
          {inputError && <p className="text-destructive text-sm mt-2">{inputError}</p>}
        </div>

        {result && (
          <div className="bg-card rounded-xl p-8 mb-6 shadow-lg">
            <h3 className="text-lg font-medium mb-3">Results</h3>
            {result.success && (result.original_markdown || result.cleaned_markdown) ? (
              <>
                <div className="mb-4 border-b border-border">
                  <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                    <button
                      onClick={() => setActiveTab('original')}
                      className={`${activeTab === 'original' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
                    >
                      Original Markdown
                    </button>
                    {result.cleaned_markdown && (
                      <button
                        onClick={() => setActiveTab('cleaned')}
                        className={`${activeTab === 'cleaned' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
                      >
                        LLM Cleaned
                      </button>
                    )}
                  </nav>
                </div>

                <div className="relative">
                  <pre className="bg-secondary p-4 rounded-md overflow-auto whitespace-pre-wrap">
                    {outputDisplay || ""}
                  </pre>
                  {outputDisplay && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleCopy}
                      className="absolute top-2 right-12 text-muted-foreground hover:text-foreground transition-all duration-150 ease-in-out transform active:scale-90"
                      title="Copy to clipboard"
                    >
                      {showCopySuccessIcon ? <Check className="h-5 w-5 text-primary" /> : <Copy className="h-5 w-5" />}
                    </Button>
                  )}
                  {outputDisplay && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleDownload}
                      className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-all duration-150 ease-in-out transform active:scale-90"
                      title="Download as .txt"
                    >
                      <Download className="h-5 w-5" />
                    </Button>
                  )}
                  {copySuccess && !showCopySuccessIcon && <p className="text-sm text-primary mt-2">{copySuccess}</p>}
                </div>
              </>
            ) : (

              <pre className="bg-secondary p-4 rounded-md overflow-auto">
                {typeof outputDisplay === 'string' ? outputDisplay : JSON.stringify(result, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>

      {/* Footer with smaller logo */}
      <div className="w-full py-4 flex justify-center">
        <a href="https://github.com/unclecode/crawl4ai">
          <img
            src="https://raw.githubusercontent.com/unclecode/crawl4ai/main/docs/assets/powered-by-dark.svg"
            alt="Powered by Crawl4AI"
            width="150"

          />
        </a>
      </div>
    </div>
  )
}
