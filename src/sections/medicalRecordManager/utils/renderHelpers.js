'use client';
import React, { useState } from 'react';
import { Box, Typography, Stack, Dialog } from '@mui/material';

/**
 * Giúp kiểm tra một giá trị có phải URL ảnh không
 */
const isImageUrl = (val) =>
  typeof val === 'string' &&
  (val.startsWith('http') || val.startsWith('data:image/')) &&
  (val.endsWith('.jpg') ||
    val.endsWith('.jpeg') ||
    val.endsWith('.png') ||
    val.endsWith('.gif') ||
    val.endsWith('.webp') ||
    val.endsWith('.bmp'));

/**
 * Biến object phẳng có key dạng "A.B.C" thành object lồng nhau thật
 *  { "Thông tin đợt 1.Câu hỏi": "Trả lời" }
 *   → { "Thông tin đợt 1": { "Câu hỏi": "Trả lời" } }
 */
function unflattenObject(obj) {
  if (Array.isArray(obj) || typeof obj !== 'object' || obj === null) return obj;
  const result = {};
  Object.entries(obj).forEach(([key, val]) => {
    if (key.includes('.')) {
      const parts = key.split('.');
      let cur = result;
      parts.forEach((p, idx) => {
        if (!cur[p]) cur[p] = idx === parts.length - 1 ? val : {};
        cur = cur[p];
      });
    } else {
      result[key] = val;
    }
  });
  return result;
}

/**
 * Biến mọi giá trị (object, array, primitive) thành chuỗi
 */
export const toDisplayText = (val) => {
  if (val == null) return '';
  if (Array.isArray(val)) return val.join(', ');
  if (typeof val === 'object') return JSON.stringify(val, null, 2);
  return String(val);
};

/**
 * Component đệ quy hiển thị câu hỏi – câu trả lời
 * - Hỗ trợ ảnh
 * - Hỗ trợ object nhiều tầng
 * - Hỗ trợ key rỗng / key chứa dấu chấm
 */
export function RenderAnswerGroup({ data, level = 0 }) {
  const [previewImg, setPreviewImg] = useState(null);
  const indent = level * 1.5;

  // Trường hợp primitive
  if (typeof data !== 'object' || data === null) {
    if (isImageUrl(data)) {
      return (
        <>
          <Box
            sx={{
              ml: indent,
              my: 1,
              cursor: 'pointer',
              display: 'inline-block',
              '&:hover': { opacity: 0.9 },
            }}
            onClick={() => setPreviewImg(data)}
          >
            <img
              src={data}
              alt="img"
              style={{
                width: 120,
                height: 120,
                objectFit: 'cover',
                borderRadius: 8,
                border: '1px solid #ccc',
              }}
            />
          </Box>

          <Dialog open={!!previewImg} onClose={() => setPreviewImg(null)} maxWidth="lg">
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <img
                src={previewImg}
                alt="preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '80vh',
                  borderRadius: 8,
                  display: 'inline-block',
                }}
              />
            </Box>
          </Dialog>
        </>
      );
    }
    return (
      <Typography variant="body2" sx={{ ml: indent, whiteSpace: 'pre-wrap' }}>
        {String(data)}
      </Typography>
    );
  }

  // Trường hợp mảng
  if (Array.isArray(data)) {
    return (
      <Stack sx={{ ml: indent }} spacing={0.5}>
        {data.map((item, idx) => (
          <RenderAnswerGroup key={idx} data={item} level={level + 1} />
        ))}
      </Stack>
    );
  }

  // Trường hợp object
  const objectData = unflattenObject(data); // ✅ xử lý dấu chấm trong key
  const keys = Object.keys(objectData).filter((k) => objectData[k] != null);
  if (keys.length === 0) return null;

  return (
    <Stack sx={{ ml: indent }} spacing={0.5}>
      {keys.map((k) => (
        <Box key={k}>
          {k.trim() !== '' && (
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {k}:
            </Typography>
          )}
          <RenderAnswerGroup data={objectData[k]} level={level + 1} />
        </Box>
      ))}
    </Stack>
  );
}
