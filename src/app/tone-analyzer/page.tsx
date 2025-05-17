"use client";

import { useState, type FormEvent } from 'react';
import { analyzeTextTone, type AnalyzeTextToneInput, type AnalyzeTextToneOutput } from '@/ai/flows/analyze-text-tone';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Lightbulb, CheckCircle, AlertCircle } from 'lucide-react';
import { SectionWrapper } from '@/components/ui/section-wrapper'; // Assuming you have this from portfolio

export default function ToneAnalyzerPage() {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<AnalyzeTextToneOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!inputText.trim()) {
      setError("Please enter some text to analyze.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const output = await analyzeTextTone({ text: inputText });
      setResult(output);
    } catch (e) {
      console.error("Error analyzing tone:", e);
      setError("Failed to analyze tone. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SectionWrapper id="tone-analyzer-tool" title="AI Text Tone Analyzer">
      <Card className="max-w-2xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="mr-2 h-6 w-6 text-primary" />
            Analyze Your Text
          </CardTitle>
          <CardDescription>
            Enter any text below to get an AI-powered analysis of its tone. This tool helps ensure your writing conveys the intended professional image.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="textToAnalyze" className="text-sm font-medium">Text to Analyze</Label>
              <Textarea
                id="textToAnalyze"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste or type your text here..."
                rows={8}
                className="mt-1"
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Analyzing...' : 'Analyze Tone'}
            </Button>
          </CardFooter>
        </form>

        {error && (
          <div className="p-6 pt-0">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {result && (
          <div className="p-6 pt-0">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle className="font-semibold">Tone Analysis Result</AlertTitle>
              <AlertDescription className="mt-2 space-y-2">
                <p><strong>Detected Tone:</strong> <span className="font-medium text-primary">{result.tone}</span></p>
                <p><strong>Explanation:</strong> {result.explanation}</p>
              </AlertDescription>
            </Alert>
          </div>
        )}
      </Card>
    </SectionWrapper>
  );
}
