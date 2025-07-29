import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Search, Brain, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ProcessingResult } from "@shared/schema";

interface QueryProcessorProps {
  onQueryStart: () => void;
  onQueryResult: (result: ProcessingResult) => void;
}

export default function QueryProcessor({ onQueryStart, onQueryResult }: QueryProcessorProps) {
  const [queryText, setQueryText] = useState("46M, knee surgery, Pune, 3-month policy");
  const { toast } = useToast();

  const queryMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest('POST', '/api/queries/process', { queryText: query });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.result) {
        onQueryResult(data.result);
        toast({
          title: "Query processed successfully",
          description: `Decision: ${data.result.decision}`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Query processing failed",
        description: error.message || "Failed to process query",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryText.trim()) {
      toast({
        title: "Query required",
        description: "Please enter a query to process",
        variant: "destructive",
      });
      return;
    }

    onQueryStart();
    queryMutation.mutate(queryText.trim());
  };

  const handleQuickSuggestion = (suggestion: string) => {
    setQueryText(suggestion);
  };

  const suggestions = [
    "Maternity coverage check",
    "Pre-existing condition",
    "Claim eligibility"
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" />
          Natural Language Query Processing
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Enter your query
            </label>
            <div className="relative">
              <Textarea
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                placeholder="e.g., 46-year-old male, knee surgery in Pune, 3-month-old insurance policy"
                className="min-h-[80px] pr-12 resize-none"
              />
              <Button
                type="submit"
                size="sm"
                className="absolute bottom-3 right-3"
                disabled={queryMutation.isPending}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Suggestions */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-gray-500">Quick suggestions:</span>
            {suggestions.map((suggestion) => (
              <Badge
                key={suggestion}
                variant="secondary"
                className="cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => handleQuickSuggestion(suggestion)}
              >
                {suggestion}
              </Badge>
            ))}
          </div>

          {/* Process Button */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={queryMutation.isPending}
          >
            {queryMutation.isPending ? (
              <>
                <Brain className="h-4 w-4 mr-2 animate-pulse" />
                Processing with AI...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Process with AI
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
