import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiConfig } from '../utils/apiConfig';

type SettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [url, setUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setUrl(apiConfig.getUrl() || 'https://www.packyapi.com');
      setApiKey(apiConfig.getKey());
      setError('');
    }
  }, [open]);

  const handleSave = () => {
    if (!url.trim()) {
      setError('请输入 API URL');
      return;
    }
    if (!apiKey.trim()) {
      setError('请输入 API Key');
      return;
    }
    apiConfig.setUrl(url.trim());
    apiConfig.setKey(apiKey.trim());
    onOpenChange(false);
  };

  const handleReset = () => {
    apiConfig.clear();
    setUrl('https://www.packyapi.com');
    setApiKey('');
    setError('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>设置</DialogTitle>
          <DialogDescription>
            管理您的应用首选项和 API 连接
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {/* API 配置 */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">API 配置</h3>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="api-url">API URL</Label>
                <Input
                  id="api-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.packyapi.com"
                />
                <p className="text-xs text-muted-foreground">
                  请求地址：{url || '{url}'}/v1beta/models/gemini-3-pro-image-preview:generateContent
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <Input
                  id="api-key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="输入您的 API Key"
                />
                <p className="text-xs text-muted-foreground">
                  Key 将存储在本地，请确保环境安全
                </p>
              </div>
            </div>
          </div>
          
          {error && (
            <p className="mt-4 text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleReset}>
            重置
          </Button>
          <Button onClick={handleSave}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
