import { useState, useCallback, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, FileText, Trash2, Check, Loader2, AlertCircle, FileWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Progress } from "@/components/ui/progress";

interface Document {
  id: string;
  originalName: string;
  fileSize: number;
  uploadedAt: string;
  isProcessed: boolean;
}

export default function DocumentUpload() {
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Reset progress when upload completes
  useEffect(() => {
    if (uploadProgress === 100) {
      const timer = setTimeout(() => {
        setUploadProgress(0);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [uploadProgress]);

  // Fetch documents
  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setUploadError(null);
      setUploadProgress(10);
      
      const formData = new FormData();
      formData.append('document', file);
      
      console.log('Uploading file:', file.name, file.type, file.size);
      
      try {
        // Add a custom XMLHttpRequest to track upload progress
        return await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          
          // Track upload progress
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const progressPercent = Math.round((event.loaded / event.total) * 90);
              setUploadProgress(progressPercent);
            }
          });
          
          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              setUploadProgress(100);
              try {
                const response = JSON.parse(xhr.responseText);
                resolve(response);
              } catch (e) {
                reject(new Error('Invalid server response'));
              }
            } else {
              try {
                const errorData = JSON.parse(xhr.responseText);
                reject(new Error(errorData.error || 'Upload failed'));
              } catch (e) {
                reject(new Error(`Server error: ${xhr.status}`));
              }
            }
          });
          
          xhr.addEventListener('error', () => {
            reject(new Error('Network error during upload'));
          });
          
          xhr.addEventListener('abort', () => {
            reject(new Error('Upload was aborted'));
          });
          
          xhr.open('POST', '/api/documents/upload');
          xhr.send(formData);
        });
      } catch (error) {
        console.error('Upload failed:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      setSelectedFile(null);
      setFileValidationError(null);
      setUploadError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      toast({
        title: "Upload successful",
        description: "Document uploaded and processing started",
      });
    },
    onError: (error: any) => {
      setUploadProgress(0);
      setUploadError(error.message || "Failed to upload document");
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Document deleted",
        description: "Document has been successfully deleted",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete document",
        variant: "destructive",
      });
    },
  });

  const [fileValidationError, setFileValidationError] = useState<string | null>(null);

  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    if (file.size > 10 * 1024 * 1024) {
      return { 
        isValid: false, 
        error: "File size must be less than 10MB" 
      };
    }

    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      return { 
        isValid: false, 
        error: "Only PDF, DOC, and DOCX files are supported" 
      };
    }

    return { isValid: true };
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setFileValidationError(null);
    
    console.log("Files dropped:", e.dataTransfer.files);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      console.log("Dropped file:", file.name, file.type);
      
      // Validate file immediately on drop
      const validation = validateFile(file);
      if (!validation.isValid && validation.error) {
        setFileValidationError(validation.error);
        toast({
          title: "Invalid file",
          description: validation.error,
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
    } else {
      console.log("No files in drop event");
    }
  }, [toast]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("File input change:", e.target.files);
    setFileValidationError(null);
    
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      console.log("Selected file:", file.name, file.type);
      
      // Validate file immediately on selection
      const validation = validateFile(file);
      if (!validation.isValid && validation.error) {
        setFileValidationError(validation.error);
        toast({
          title: "Invalid file",
          description: validation.error,
          variant: "destructive",
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
      
      setSelectedFile(file);
    } else {
      console.log("No file selected");
      setSelectedFile(null);
    }
  };

  const handleFileUpload = (file: File) => {
    console.log("Handling file upload:", file.name, file.type, file.size);
    
    const validation = validateFile(file);
    if (!validation.isValid) {
      toast({
        title: "Invalid file",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate(file);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Document Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Upload Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(uploadError || fileValidationError) && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{uploadError || fileValidationError}</AlertDescription>
            </Alert>
          )}
          
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              dragActive ? 'border-primary bg-blue-50' : fileValidationError ? 'border-error bg-red-50' : 'border-gray-300 hover:border-primary'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !selectedFile && document.getElementById('file-input')?.click()}
          >
            {!selectedFile ? (
              <>
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-secondary mb-2">Drop files here or click to upload</p>
                <p className="text-sm text-gray-500 mb-4">Supports PDF, DOC, DOCX files up to 10MB</p>
              </>
            ) : (
              <div className="py-2">
                <div className="flex items-center justify-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 mb-4">
                  <FileText className="h-8 w-8 text-primary" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-secondary truncate max-w-[200px]">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      setFileValidationError(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-gray-400 hover:text-error" />
                  </Button>
                </div>
                <Button 
                  type="button" 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (selectedFile) {
                      handleFileUpload(selectedFile);
                    }
                  }}
                  disabled={uploadMutation.isPending}
                  className="mx-auto"
                >
                  {uploadMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload File
                    </>
                  )}
                </Button>
              </div>
            )}
            
            {uploadProgress > 0 && (
              <div className="w-full mb-4">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">
                  {uploadProgress < 100 ? 'Uploading...' : 'Processing...'}
                </p>
              </div>
            )}
            
            {/* Direct file input form as backup method */}
            <form 
              action="/api/documents/upload"
              method="POST"
              encType="multipart/form-data"
              className="mb-4"
              onSubmit={(e) => {
                // Prevent form submission if we're handling it via JS
                e.preventDefault();
              }}
            >
              <input
                id="file-input"
                name="document"
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={handleFileSelect}
              />
              {!selectedFile && (
                <Button 
                  type="button" 
                  disabled={uploadMutation.isPending}
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Files
                </Button>
              )}
            </form>
          </div>
        </CardContent>
      </Card>

      {/* Document Library */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Document Library
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
          ) : documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No documents uploaded yet</p>
              <p className="text-sm text-gray-400">Upload your first document to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((document) => (
                <div
                  key={document.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-6 w-6 text-error" />
                    <div>
                      <p className="text-sm font-medium text-secondary">{document.originalName}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(document.fileSize)} • Updated {formatDate(document.uploadedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {document.isProcessed ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <Loader2 className="h-4 w-4 text-primary animate-spin" />
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/api/documents/${document.id}/preview`, '_blank')}
                      disabled={!document.isProcessed}
                    >
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(document.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-gray-400 hover:text-error" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
