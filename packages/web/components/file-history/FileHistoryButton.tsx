import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { History } from 'lucide-react';
import FileHistoryViewer from './FileHistoryViewer';

interface FileHistoryButtonProps {
  /**
   * The URL of the git repository
   */
  repoUrl: string;
  
  /**
   * The path to the file within the repository
   */
  filePath: string;
  
  /**
   * Optional initial branch to use
   */
  initialBranch?: string;
  
  /**
   * Optional CORS proxy URL to use for Git operations
   */
  corsProxy?: string;
  
  /**
   * Optional custom button text
   */
  buttonText?: string;
  
  /**
   * Optional CSS class name for the button
   */
  className?: string;
  
  /**
   * Optional button variant
   */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  
  /**
   * Optional button size
   */
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const FileHistoryButton: React.FC<FileHistoryButtonProps> = ({
  repoUrl,
  filePath,
  initialBranch = 'main',
  corsProxy,
  buttonText = 'File History',
  className = '',
  variant = 'outline',
  size = 'sm',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
        >
          <History className="mr-2 h-4 w-4" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl w-full h-[80vh] max-h-[800px]">
        <DialogHeader>
          <DialogTitle>File History</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <FileHistoryViewer
            repoUrl={repoUrl}
            filePath={filePath}
            initialBranch={initialBranch}
            corsProxy={corsProxy}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FileHistoryButton;