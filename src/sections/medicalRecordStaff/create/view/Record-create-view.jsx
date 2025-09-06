'use client';

import { useState, useEffect, useCallback } from 'react';
import React from 'react'; // Thêm import React để dùng Fragment <>

// --- MUI Components ---
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import OutlinedInput from '@mui/material/OutlinedInput';
import FormHelperText from '@mui/material/FormHelperText';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

// --- Custom Hook & Components ---
import { useRecordCreateQuestion } from '../Record-create-question';
import { RecordCreateButtons } from '../Record-create-button';

// ----------------------------------------------------------------------

const renderQuestion = (question, formState, handleInputChange) => {
  const questionCode = question.code;
  const value = formState[questionCode];
  const commonProps = {
    label: question.name,
    fullWidth: true,
    variant: 'outlined',
  };

  // Hàm render không có case 'full_date' nữa, nó sẽ rơi vào default
  switch (question.valueType) {
    case 'number':
      return <TextField key={questionCode} {...commonProps} type="number" value={value || ''} onChange={(e) => handleInputChange(questionCode, e.target.value)} helperText={question.description} />;
    case 'text':
      return <TextField key={questionCode} {...commonProps} type="text" value={value || ''} onChange={(e) => handleInputChange(questionCode, e.target.value)} helperText={question.description} />;
    case 'selection':
      return (
        <FormControl key={questionCode} fullWidth>
          <InputLabel>{question.name}</InputLabel>
          <Select {...commonProps} value={value || ''} onChange={(e) => handleInputChange(questionCode, e.target.value)}>
            {(question.valueOptions || []).map((option) => (<MenuItem key={option} value={option}>{option}</MenuItem>))}
          </Select>
          {question.description && <FormHelperText>{question.description}</FormHelperText>}
        </FormControl>
      );
    case 'multi_selection':
      return (
        <FormControl key={questionCode} fullWidth>
          <InputLabel>{question.name}</InputLabel>
          <Select {...commonProps} multiple value={value || []} onChange={(e) => handleInputChange(questionCode, e.target.value)} input={<OutlinedInput label={question.name} />} renderValue={(selected) => (<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>{selected.map((val) => <Chip key={val} label={val} />)}</Box>)}>
            {(question.valueOptions || []).map((option) => (<MenuItem key={option} value={option}>{option}</MenuItem>))}
          </Select>
          {question.description && <FormHelperText>{question.description}</FormHelperText>}
        </FormControl>
      );
    default:
      return <TextField key={questionCode} {...commonProps} type="text" value={value || ''} onChange={(e) => handleInputChange(questionCode, e.target.value)} helperText={`Kiểu dữ liệu: ${question.valueType}. ${question.description || ''}`} />;
  }
};

export function RecordCreateView() {
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const { questions, formState, isLoading, error, templateName, handleInputChange } = useRecordCreateQuestion(selectedTemplateId);

  const handleSubmit = () => {
    console.log('Dữ liệu form đã gửi:', { templateId: selectedTemplateId, answers: formState });
  };

  const handleTemplateSelect = (id) => {
    setSelectedTemplateId(id);
  };

  const handleCloseDialog = () => {
    setSelectedTemplateId(null);
  };
  
  return (
    // 👇 Bỏ LocalizationProvider, dùng Fragment <>...</> để bọc
    <>
      <RecordCreateButtons onTemplateSelect={handleTemplateSelect} />

      <Dialog
        fullWidth
        maxWidth="md"
        open={!!selectedTemplateId}
        onClose={handleCloseDialog}
      >
        <DialogTitle sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {`Tạo hồ sơ theo mẫu: "${templateName}"`}
          <IconButton onClick={handleCloseDialog}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent dividers>
          {isLoading && (<Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box>)}
          {error && <Alert severity="error">{error}</Alert>}
          {!isLoading && !error && (
            questions.length > 0 ? (
              <Stack spacing={3} sx={{ mt: 2 }}>
                {questions.map((q) => renderQuestion(q, formState, handleInputChange))}
                <Button variant="contained" size="large" onClick={handleSubmit}>
                  Tạo hồ sơ
                </Button>
              </Stack>
            ) : (
              <Typography color="text.secondary" sx={{ py: 5, textAlign: 'center' }}>
                Không có câu hỏi nào trong mẫu này.
              </Typography>
            )
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}