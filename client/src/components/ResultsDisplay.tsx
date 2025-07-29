import { useState } from "react";
import { CheckCircle, XCircle, Clock, Settings, Gavel, Code, Copy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ProcessingResult } from "@shared/schema";

interface ResultsDisplayProps {
  result: ProcessingResult;
}

export default function ResultsDisplay({ result }: ResultsDisplayProps) {
  const [showJSON, setShowJSON] = useState(false);
  const { toast } = useToast();

  const getDecisionIcon = (decision: string) => {
    switch (decision) {
      case 'approved':
        return <CheckCircle className="h-12 w-12 text-success" />;
      case 'rejected':
        return <XCircle className="h-12 w-12 text-error" />;
      case 'pending':
        return <Clock className="h-12 w-12 text-warning" />;
      default:
        return <Clock className="h-12 w-12 text-gray-400" />;
    }
  };

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'approved':
        return 'bg-success/10 text-success border-success/20';
      case 'rejected':
        return 'bg-error/10 text-error border-error/20';
      case 'pending':
        return 'bg-warning/10 text-warning border-warning/20';
      default:
        return 'bg-gray-100 text-gray-600 border-gray/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'met':
        return 'bg-success text-white';
      case 'not_met':
        return 'bg-error text-white';
      case 'unclear':
        return 'bg-warning text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const copyJSON = async () => {
    const jsonResponse = {
      decision: result.decision,
      amount: result.amount,
      deductible: result.deductible,
      coverageDetails: result.coverageDetails,
      justification: result.justification,
      confidenceScore: result.confidenceScore,
      processingTimeMs: result.processingTimeMs
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(jsonResponse, null, 2));
      toast({
        title: "JSON copied",
        description: "Response has been copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy JSON to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Analysis Results</CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={getDecisionColor(result.decision)}>
              <CheckCircle className="h-3 w-3 mr-1" />
              {result.decision.charAt(0).toUpperCase() + result.decision.slice(1)}
            </Badge>
            <span className="text-sm text-gray-500">
              Processed in {(result.processingTimeMs / 1000).toFixed(1)}s
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Structured Query Analysis */}
        {result.coverageDetails && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-secondary mb-3 flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" />
              Parsed Query Elements
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {result.coverageDetails.patientAge && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{result.coverageDetails.patientAge}</div>
                  <div className="text-sm text-gray-600">Age (Years)</div>
                </div>
              )}
              {result.coverageDetails.procedure && (
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">{result.coverageDetails.procedure}</div>
                  <div className="text-sm text-gray-600">Procedure</div>
                </div>
              )}
              {result.coverageDetails.location && (
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">{result.coverageDetails.location}</div>
                  <div className="text-sm text-gray-600">Location</div>
                </div>
              )}
              {result.coverageDetails.policyDurationMonths && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{result.coverageDetails.policyDurationMonths}</div>
                  <div className="text-sm text-gray-600">Policy Age (Months)</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Decision Summary */}
        <div className={`p-6 rounded-lg border ${getDecisionColor(result.decision)}`}>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              {getDecisionIcon(result.decision)}
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold mb-2">
                Claim {result.decision.charAt(0).toUpperCase() + result.decision.slice(1)}
              </h4>
              <p className="mb-3">
                {result.decision === 'approved' 
                  ? `Yes, ${result.coverageDetails?.procedure || 'the procedure'} is covered under the policy.`
                  : result.decision === 'rejected'
                  ? `The claim has been rejected based on policy terms.`
                  : `The claim requires additional review.`
                }
              </p>
              {(result.amount || result.deductible) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.amount && (
                    <div>
                      <span className="text-sm font-medium">Coverage Amount:</span>
                      <span className="text-sm ml-2">₹{result.amount.toLocaleString()}</span>
                    </div>
                  )}
                  {result.deductible && (
                    <div>
                      <span className="text-sm font-medium">Deductible:</span>
                      <span className="text-sm ml-2">₹{result.deductible.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Justification */}
        {result.justification && result.justification.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-semibold text-secondary flex items-center gap-2">
              <Gavel className="h-4 w-4 text-primary" />
              Decision Justification
            </h4>
            
            <div className="space-y-3">
              {result.justification.map((justification, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${getStatusColor(justification.status)}`}>
                      <span className="text-xs font-bold">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <h5 className="font-medium text-secondary mb-2">
                        {justification.criterion.split('_').map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')}
                      </h5>
                      <p className="text-sm text-gray-600 mb-3">{justification.description}</p>
                      <div className="bg-gray-50 p-3 rounded text-xs">
                        <span className="font-medium">Source:</span> {justification.sourceClause}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* JSON Response */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-secondary flex items-center gap-2">
              <Code className="h-4 w-4 text-primary" />
              Structured JSON Response
            </h4>
            <Button variant="outline" size="sm" onClick={copyJSON}>
              <Copy className="h-3 w-3 mr-1" />
              Copy JSON
            </Button>
          </div>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
            <code>
              {JSON.stringify({
                decision: result.decision,
                amount: result.amount,
                deductible: result.deductible,
                coverageDetails: result.coverageDetails,
                justification: result.justification,
                confidenceScore: result.confidenceScore,
                processingTimeMs: result.processingTimeMs
              }, null, 2)}
            </code>
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
