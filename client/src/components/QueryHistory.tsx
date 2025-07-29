import { useQuery } from "@tanstack/react-query";
import { History, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface QueryHistoryItem {
  query: {
    id: string;
    queryText: string;
    createdAt: string;
  };
  result: {
    decision: string;
    amount?: string;
    processingTimeMs: number;
  } | null;
}

export default function QueryHistory() {
  const { data: history = [], isLoading } = useQuery<QueryHistoryItem[]>({
    queryKey: ["/api/queries/history"],
  });

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'approved':
        return 'bg-success/10 text-success';
      case 'rejected':
        return 'bg-error/10 text-error';
      case 'pending':
        return 'bg-warning/10 text-warning';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Recent Queries
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8">
            <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No queries processed yet</p>
            <p className="text-sm text-gray-400">Your query history will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div
                key={item.query.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-secondary line-clamp-1">
                    {item.query.queryText}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatTimeAgo(item.query.createdAt)}
                    {item.result && (
                      <>
                        {' • '}
                        <span className="capitalize">{item.result.decision}</span>
                        {item.result.amount && (
                          <>
                            {' • '}
                            ₹{parseInt(item.result.amount).toLocaleString()}
                          </>
                        )}
                      </>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {item.result && (
                    <Badge className={getDecisionColor(item.result.decision)}>
                      {item.result.decision.charAt(0).toUpperCase() + item.result.decision.slice(1)}
                    </Badge>
                  )}
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-3 w-3 text-gray-400" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
