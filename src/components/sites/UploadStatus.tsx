import { RefreshCw, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "@/components/ui/badge";

interface  UploadStatusProps {
    status?: string;
    stage?: string;
    error?: string | null;
    onRetry?: () => void;
}
export const UploadStatus = ({ status, stage, error, onRetry}: UploadStatusProps) => {
    const getStatusColor = (status?: string) => {
        switch (status) {
            case "completed":
                return "success";
            case "failed":
                return "destructive";
            case "uploading":
            case "processing":
                return "warning";
            default:
                return "secondary";
        }
    };
    const getStatusIcon = (status?: string) => {
        switch (status) {
            case "completed":
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case "failed":
                return <XCircle className="w-4 h-4 text-red-500" />;
            case "uploading":
            case "processing":
                return <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />;
            default:
                return <RefreshCw className="w-4 h-4 text-gray-400" />;
        }
    };
    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
                {getStatusIcon(status)}
                <Badge variant={getStatusColor(status)}>
                    {status ?? "pending"}
                </Badge>
                <span className="text-xs text-muted-foreground">
                    Stage: {stage ?? "supabase"}
                </span>
            </div>
            {error && (
                <div className="text-xs text-destructive max-w-xs">
                    {error}
                    {onRetry && (
                        <Button variant="link" size="sm" className="text-xs pl-1" onClick={onRetry}>
                            Retry
                        </Button>
                    )}
                </div>    
            )}
        </div>
    );
}