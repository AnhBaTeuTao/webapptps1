import { useState } from 'react';
import { Check } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface LineNoteEditorProps {
  note?: string;
  onSave: (note: string) => void;
  /** compact: cột Đơn hàng bên phải; comfortable: ngăn kéo thanh toán trên điện thoại */
  size?: 'compact' | 'comfortable';
}

/**
 * Ghi chú từng dòng hàng: Enter / nút Lưu / rời ô => khóa ghi chú,
 * hiện hộp xanh nhạt kèm nút "Sửa".
 */
export default function LineNoteEditor({ note = '', onSave, size = 'compact' }: LineNoteEditorProps) {
  const { t } = useLanguage();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note);
  const compact = size === 'compact';

  const commit = () => {
    onSave(draft.trim());
    setEditing(false);
  };
  const startEdit = (value: string) => {
    setDraft(value);
    setEditing(true);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          type="text"
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commit();
            } else if (e.key === 'Escape') {
              setEditing(false);
            }
          }}
          placeholder={t('Ghi chú quy cách (vd: sơ chế, thái lát...)')}
          className={`min-w-0 flex-1 rounded-lg border border-[#0f7a4f]/40 bg-white px-2.5 text-[#17231d] placeholder:text-[#59665f]/50 focus:border-[#0f7a4f] focus:outline-none ${compact ? 'h-7 text-[11px]' : 'h-9 text-xs'}`}
        />
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            commit();
          }}
          className={`shrink-0 rounded-lg bg-[#0f7a4f] font-bold text-white hover:bg-[#0b4f34] cursor-pointer ${compact ? 'h-7 px-2 text-[11px]' : 'h-9 px-3 text-xs'}`}
          aria-label={t('Lưu ghi chú')}
        >
          <span className="inline-flex items-center gap-1"><Check size={compact ? 12 : 14} />{t('Lưu')}</span>
        </button>
      </div>
    );
  }

  if (note) {
    return (
      <div className={`flex items-center justify-between gap-2 rounded-lg border border-[#0f7a4f]/20 bg-[#eaf6ef]/80 text-[#0b4f34] ${compact ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'}`}>
        <span className="min-w-0 flex-1 truncate italic" title={note}>📝 {note}</span>
        <button
          type="button"
          onClick={() => startEdit(note)}
          className="shrink-0 font-bold text-[#0f7a4f] hover:underline cursor-pointer"
        >
          {t('Sửa')}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => startEdit('')}
      className={`font-medium text-[#59665f] hover:text-[#0f7a4f] cursor-pointer ${compact ? 'text-[10.5px]' : 'text-xs'}`}
    >
      + {t('Thêm ghi chú sơ chế')}
    </button>
  );
}
