import { useMemo, useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { apiConfig, type ApiType } from '../utils/apiConfig';

type SettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [apiType, setApiType] = useState<ApiType>('gemini');

  // Gemini 模型配置
  const [geminiModel, setGeminiModel] = useState('');

  const [openAIModels, setOpenAIModels] = useState<string[]>([]);
  const [newOpenAIModel, setNewOpenAIModel] = useState('');
  const [openAIAddError, setOpenAIAddError] = useState('');

  const [editingOpenAIModel, setEditingOpenAIModel] = useState<string | null>(null);
  const [editingOpenAIModelValue, setEditingOpenAIModelValue] = useState('');
  const [openAIEditError, setOpenAIEditError] = useState('');

  const [deleteConfirmModel, setDeleteConfirmModel] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setApiType(apiConfig.getType());
      setGeminiModel(apiConfig.getGeminiModel());
      setOpenAIModels(apiConfig.getOpenAIModelList());
      setNewOpenAIModel('');
      setOpenAIAddError('');
      setEditingOpenAIModel(null);
      setEditingOpenAIModelValue('');
      setOpenAIEditError('');
      setDeleteConfirmModel(null);
    }
  }, [open]);

  useEffect(() => {
    if (apiType !== 'openai') {
      setNewOpenAIModel('');
      setOpenAIAddError('');
      setEditingOpenAIModel(null);
      setEditingOpenAIModelValue('');
      setOpenAIEditError('');
      setDeleteConfirmModel(null);
    }
  }, [apiType]);

  const handleSave = () => {
    apiConfig.setType(apiType);
    if (geminiModel.trim()) {
      apiConfig.setGeminiModel(geminiModel.trim());
    }
    onOpenChange(false);
  };

  const handleReset = () => {
    apiConfig.clear();
    setApiType('gemini');
    setGeminiModel(apiConfig.getGeminiModel());
    setOpenAIModels([]);
    setNewOpenAIModel('');
    setOpenAIAddError('');
    setEditingOpenAIModel(null);
    setEditingOpenAIModelValue('');
    setOpenAIEditError('');
    setDeleteConfirmModel(null);
  };

  const normalizedOpenAIModels = useMemo(() => openAIModels.map((item) => item.trim()).filter(Boolean), [openAIModels]);

  const refreshOpenAIModels = () => setOpenAIModels(apiConfig.getOpenAIModelList());

  const startEditingModel = (modelName: string) => {
    setEditingOpenAIModel(modelName);
    setEditingOpenAIModelValue(modelName);
    setOpenAIEditError('');
  };

  const cancelEditingModel = () => {
    setEditingOpenAIModel(null);
    setEditingOpenAIModelValue('');
    setOpenAIEditError('');
  };

  const submitNewModel = () => {
    const normalized = newOpenAIModel.trim();
    if (!normalized) {
      setOpenAIAddError('请输入模型名称');
      return;
    }
    if (normalizedOpenAIModels.includes(normalized)) {
      setOpenAIAddError('模型名称已存在');
      return;
    }

    apiConfig.addOpenAIModel(normalized);
    refreshOpenAIModels();
    setNewOpenAIModel('');
    setOpenAIAddError('');
  };

  const submitEditModel = () => {
    if (!editingOpenAIModel) return;

    const oldName = editingOpenAIModel.trim();
    const nextName = editingOpenAIModelValue.trim();

    if (!nextName) {
      setOpenAIEditError('请输入模型名称');
      return;
    }

    if (nextName === oldName) {
      cancelEditingModel();
      return;
    }

    if (normalizedOpenAIModels.includes(nextName)) {
      setOpenAIEditError('模型名称已存在');
      return;
    }

    apiConfig.updateOpenAIModel(oldName, nextName);
    refreshOpenAIModels();
    cancelEditingModel();
  };

  const confirmDeleteModel = () => {
    if (!deleteConfirmModel) return;
    apiConfig.removeOpenAIModel(deleteConfirmModel);
    refreshOpenAIModels();
    if (editingOpenAIModel === deleteConfirmModel) cancelEditingModel();
    setDeleteConfirmModel(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>设置</DialogTitle>
          <DialogDescription>
            管理模型配置
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">模型配置</h3>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="api-type">API 类型</Label>
                <Select value={apiType} onValueChange={(value: ApiType) => setApiType(value)}>
                  <SelectTrigger id="api-type">
                    <SelectValue placeholder="选择 API 类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini">Gemini (原生格式)</SelectItem>
                    <SelectItem value="openai">OpenAI 兼容格式</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {apiType === 'gemini'
                    ? '使用 Gemini 原生 API 格式，支持图片生成和编辑'
                    : '使用 OpenAI 兼容 API 格式，适用于普通 Chat 对话'}
                </p>
              </div>

              {apiType === 'gemini' && (
                <div className="space-y-2">
                  <Label htmlFor="gemini-model">模型 ID</Label>
                  <Input
                    id="gemini-model"
                    value={geminiModel}
                    onChange={(e) => setGeminiModel(e.target.value)}
                    placeholder="gemini-2.0-flash-exp-image-generation"
                  />
                  <p className="text-xs text-muted-foreground">
                    输入 Gemini 模型名称
                  </p>
                </div>
              )}
            </div>
          </div>

          {apiType === 'openai' && (
            <div className="pt-6 space-y-4">
              <Separator />
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-muted-foreground">OpenAI 模型管理</h3>
                <p className="text-xs text-muted-foreground">
                  管理可选模型列表（用于聊天栏下拉选择）
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="openai-model-new">新增模型</Label>
                <div className="flex gap-2">
                  <Input
                    id="openai-model-new"
                    value={newOpenAIModel}
                    onChange={(e) => {
                      setNewOpenAIModel(e.target.value);
                      if (openAIAddError) setOpenAIAddError('');
                    }}
                    placeholder="例如：gpt-4o-mini"
                    className="h-9"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') submitNewModel();
                    }}
                  />
                  <Button type="button" variant="secondary" className="h-9" onClick={submitNewModel}>
                    <Plus className="h-4 w-4 mr-2" />
                    新增
                  </Button>
                </div>
                {openAIAddError && <p className="text-xs text-destructive">{openAIAddError}</p>}
              </div>

              <div className="rounded-lg border overflow-hidden">
                <div className="bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  当前模型列表
                </div>
                {openAIModels.length === 0 ? (
                  <div className="px-3 py-3 text-sm text-muted-foreground">
                    暂无模型，请先添加一个
                  </div>
                ) : (
                  <div className="divide-y">
                    {openAIModels.map((item) => {
                      const isEditing = editingOpenAIModel === item;
                      return (
                        <div key={item} className="flex items-center gap-2 px-3 py-2">
                          <div className="min-w-0 flex-1">
                            {isEditing ? (
                              <div className="space-y-1">
                                <Input
                                  value={editingOpenAIModelValue}
                                  onChange={(e) => {
                                    setEditingOpenAIModelValue(e.target.value);
                                    if (openAIEditError) setOpenAIEditError('');
                                  }}
                                  className="h-8"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') submitEditModel();
                                    if (e.key === 'Escape') cancelEditingModel();
                                  }}
                                />
                                {openAIEditError && <p className="text-xs text-destructive">{openAIEditError}</p>}
                              </div>
                            ) : (
                              <div className="truncate text-sm font-mono text-foreground">{item}</div>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            {isEditing ? (
                              <>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={submitEditModel}
                                  title="保存"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={cancelEditingModel}
                                  title="取消"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => startEditingModel(item)}
                                  title="编辑"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => setDeleteConfirmModel(item)}
                                  title="删除"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
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

      {/* 删除模型确认 */}
      <Dialog
        open={!!deleteConfirmModel}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setDeleteConfirmModel(null);
        }}
      >
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>删除模型</DialogTitle>
            <DialogDescription>
              确认删除该模型吗？
            </DialogDescription>
          </DialogHeader>
          <div className="text-sm">
            <span className="text-muted-foreground">模型：</span>
            <span className="font-mono">{deleteConfirmModel ?? ''}</span>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteConfirmModel(null)}>
              取消
            </Button>
            <Button variant="destructive" onClick={confirmDeleteModel}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
