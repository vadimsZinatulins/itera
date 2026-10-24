export type OpenBlockEditorProps = {
  index: number;
  markdown: string;
  onChange: (markdown: string) => void;
  onSave: () => void;
  onCancel: () => void;
};
