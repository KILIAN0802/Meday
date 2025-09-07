import { useState, useEffect, useCallback } from 'react';
import { getMedicalRecordTemplateById } from 'src/api/medial-record-templates-staff';
import { getVitalGroupById } from 'src/api/vitals';

export function useRecordCreateQuestion(templateId) {
  const [questions, setQuestions] = useState([]);
  const [formState, setFormState] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [templateName, setTemplateName] = useState('');
  const [vitalGroupIds, setVitalGroupIds] = useState([]); // <-- thêm dòng này

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
      setTemplateName(templateData.name);

      // Lấy vitalGroupIds từ template
      const groupIds = templateData.vitalGroupIds || [];
      setVitalGroupIds(groupIds); // <-- set ra state để trả FE

      if (groupIds.length === 0) {
        setQuestions([]);
        setIsLoading(false);
        return;
      }

      const groupPromises = groupIds.map(id => getVitalGroupById(id));
      const groupResponses = await Promise.all(groupPromises);

      const allQuestions = groupResponses.flatMap(response => response.data.indicators || []);
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
      setError('Không thể tải danh sách câu hỏi.');
      console.error(err);
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

  // <-- thêm vitalGroupIds vào return
  return { questions, formState, isLoading, error, templateName, handleInputChange, vitalGroupIds };
}
