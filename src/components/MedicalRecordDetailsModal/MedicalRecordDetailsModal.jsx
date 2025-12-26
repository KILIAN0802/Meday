// MedicalRecordDialog.jsx
import React from 'react';
import { useRecordCreateQuestion } from '../../sections/medicalRecordStaff/create/Record-create-question';

export function MedicalRecordDialog({ templateId, onClose }) {
  const {
    questions,
    formState,
    isLoading,
    error,
    templateName,
    handleInputChange,
  } = useRecordCreateQuestion(templateId);

  if (!templateId) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-lg p-6 w-[600px] max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {isLoading ? 'Đang tải...' : templateName || 'Mẫu bệnh án'}
        </h2>

        {error && <p className="text-red-500 mb-2">{error}</p>}

        {!isLoading && !error && (
          <form className="space-y-4">
            {questions.map((q) => (
              <div key={q.id} className="flex flex-col">
                <label className="font-medium mb-1">{q.name}</label>

                {/* render input tùy theo valueType */}
                {q.valueType === 'text' && (
                  <input
                    type="text"
                    className="border rounded px-2 py-1"
                    value={formState[q.code] || ''}
                    onChange={(e) => handleInputChange(q.code, e.target.value)}
                  />
                )}

                {q.valueType === 'number' && (
                  <input
                    type="number"
                    className="border rounded px-2 py-1"
                    value={formState[q.code] || ''}
                    onChange={(e) =>
                      handleInputChange(q.code, Number(e.target.value))
                    }
                  />
                )}

                {q.valueType === 'multi_selection' && (
                  <select
                    multiple
                    className="border rounded px-2 py-1"
                    value={formState[q.code] || []}
                    onChange={(e) =>
                      handleInputChange(
                        q.code,
                        Array.from(
                          e.target.selectedOptions,
                          (option) => option.value
                        )
                      )
                    }
                  >
                    {(q.options || []).map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}

                {q.valueType === 'single_selection' && (
                  <select
                    className="border rounded px-2 py-1"
                    value={formState[q.code] || ''}
                    onChange={(e) => handleInputChange(q.code, e.target.value)}
                  >
                    <option value="">Chọn...</option>
                    {(q.options || []).map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}

                {q.code === 'OPENINGDATE' && (
                  <input
                    type="date"
                    className="border rounded px-2 py-1"
                    value={
                      formState[q.code]
                        ? new Date(formState[q.code])
                            .toISOString()
                            .split('T')[0]
                        : ''
                    }
                    onChange={(e) => handleInputChange(q.code, e.target.value)}
                  />
                )}
              </div>
            ))}
          </form>
        )}

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
          >
            Đóng
          </button>
          <button
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => console.log('Form data:', formState)}
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}
