import { useState, useEffect, useCallback } from 'react';
import { getMedicalRecordTemplateById } from 'src/api/medical-record-templates-staff.js';
import { getVitalGroupById } from 'src/api/vitals';

export function useRecordCreateQuestion(templateId) {
  const [questions, setQuestions] = useState([]);
  const [formState, setFormState] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [templateName, setTemplateName] = useState('');
  const [vitalGroupIds, setVitalGroupIds] = useState([]);

  const fetchQuestions = useCallback(async () => {
    if (!templateId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const templateResponse = await getMedicalRecordTemplateById(templateId);
      const templateData = templateResponse.data;
      setTemplateName(templateData.name || '');
      const groupIds = templateData.vitalGroupIds || [];

      setVitalGroupIds(groupIds);

      if (groupIds.length === 0) {
        setQuestions([]);
        setFormState({});
        setIsLoading(false);
        return;
      }

      const groupResponses = await Promise.all(groupIds.map(id => getVitalGroupById(id)));
      const allQuestions = groupResponses.flatMap(res => res.data?.indicators || []);

      setQuestions(allQuestions);

      const initialFormState = {};
      allQuestions.forEach(q => {
        if (q.code === 'OPENINGDATE') {
          initialFormState[q.code] = new Date();
        } else if (q.valueType === 'multi_selection') {
          initialFormState[q.code] = [];
        } else {
          initialFormState[q.code] = '';
        }
      });

      setFormState(initialFormState);
    } catch (err) {
      console.error('Lỗi khi tải câu hỏi:', err);
      setError('Không thể tải danh sách câu hỏi.');
    } finally {
      setIsLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleInputChange = (questionCode, value) => {
    setFormState(prev => ({
      ...prev,
      [questionCode]: value,
    }));
  };
console.log('Questions:', questions);
console.log(templateId, '=> VitalGroupIds:', vitalGroupIds);

  return {
    questions,
    formState,
    isLoading,
    error,
    templateName,
    handleInputChange,
    vitalGroupIds,
  };
}

