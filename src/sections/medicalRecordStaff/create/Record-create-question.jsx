import { useState, useEffect, useCallback } from 'react';

import { getMedicalRecordTemplateById } from 'src/api/medical-record-templates-staff';
import { getVitalGroupById } from 'src/api/vitals';

export function useRecordCreateQuestion(templateId) {
  const [questions, setQuestions] = useState([]);
  const [formState, setFormState] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [templateName, setTemplateName] = useState('');

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

      const vitalGroupIds = templateData.vitalGroupIds || [];
      if (vitalGroupIds.length === 0) {
        setQuestions([]);
        setIsLoading(false);
        return;
      }

      const groupPromises = vitalGroupIds.map(id => getVitalGroupById(id));
      const groupResponses = await Promise.all(groupPromises);

      const allQuestions = groupResponses.flatMap(response => response.data.indicators || []);
      setQuestions(allQuestions);

      const initialFormState = {};
      allQuestions.forEach(q => {
        // Nếu là câu hỏi ngày mở hồ sơ, gán ngày hôm nay
        if (q.code === 'OPENINGDATE') {
          initialFormState[q.code] = new Date(); // Gán object Date
        } 
        // Nếu là câu hỏi đa lựa chọn, gán mảng rỗng
        else if (q.valueType === 'multi_selection') {
          initialFormState[q.code] = [];
        } 
        // Mặc định là chuỗi rỗng
        else {
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

  return { questions, formState, isLoading, error, templateName, handleInputChange };
}