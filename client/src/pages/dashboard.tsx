import { useState } from "react";
import DocumentUpload from "@/components/DocumentUpload";
import QueryProcessor from "@/components/QueryProcessor";
import ResultsDisplay from "@/components/ResultsDisplay";
import QueryHistory from "@/components/QueryHistory";
import { ProcessingResult } from "@shared/schema";
import { Bell, HelpCircle } from "lucide-react";

export default function Dashboard() {
  const [currentResult, setCurrentResult] = useState<ProcessingResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleQueryResult = (result: ProcessingResult) => {
    setCurrentResult(result);
    setIsProcessing(false);
  };

  const handleQueryStart = () => {
    setIsProcessing(true);
    setCurrentResult(null);
  };

  return (
    <div className="min-h-screen bg-neutral">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-primary">DocuMind AI</h1>
              </div>
              <nav className="hidden md:ml-8 md:flex md:space-x-8">
                <a href="#" className="text-secondary hover:text-primary px-3 py-2 text-sm font-medium">Dashboard</a>
                <a href="#" className="text-secondary hover:text-primary px-3 py-2 text-sm font-medium">Documents</a>
                <a href="#" className="text-secondary hover:text-primary px-3 py-2 text-sm font-medium">Analytics</a>
                <a href="#" className="text-secondary hover:text-primary px-3 py-2 text-sm font-medium">Settings</a>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-secondary hover:text-primary">
                <Bell className="h-5 w-5" />
              </button>
              <div className="flex items-center space-x-2">
                <img 
                  className="h-8 w-8 rounded-full" 
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=32&h=32" 
                  alt="User avatar" 
                />
                <span className="text-sm font-medium text-secondary">John Smith</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <DocumentUpload />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <QueryProcessor 
              onQueryStart={handleQueryStart}
              onQueryResult={handleQueryResult}
            />
            
            {isProcessing && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-secondary">Processing Status</h3>
                  <div className="flex items-center space-x-2">
                    <div className="animate-pulse w-2 h-2 bg-primary rounded-full"></div>
                    <span className="text-sm text-gray-500">AI Processing...</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-success rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-sm text-secondary">Query parsed and structured</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-success rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-sm text-secondary">Document search completed</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
                    <span className="text-sm text-secondary">Analyzing policy clauses...</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                    <span className="text-sm text-gray-400">Generating decision...</span>
                  </div>
                </div>
              </div>
            )}

            {currentResult && (
              <ResultsDisplay result={currentResult} />
            )}

            <QueryHistory />
          </div>
        </div>
      </div>

      {/* Floating Help Button */}
      <div className="fixed bottom-6 right-6">
        <button className="bg-primary text-white w-14 h-14 rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center">
          <HelpCircle className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
