'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import { findImageUrls, extractFinalValue } from '../../utils/dataUtils';

// ====================== Common utils ======================
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);

const hasValue = (value) => {
  if (value === null || typeof value === 'undefined') return false;
  if (Array.isArray(value)) return value.some((item) => hasValue(item));
  if (isObj(value) && Object.keys(value).length > 0) {
    return Object.values(value).some((item) => hasValue(item));
  }
  return String(value).trim() !== '';
};

const getActualAnswer = (data) => {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return data;
  const keys = Object.keys(data);
  if (keys.length === 1) return getActualAnswer(data[keys[0]]);
  return data;
};

const findFieldsArray = (valueOptions) => {
  if (!valueOptions) return [];
  if (Array.isArray(valueOptions.fields)) return valueOptions.fields;
  if (Array.isArray(valueOptions.field)) return valueOptions.field;
  const { group } = valueOptions || {};
  if (!group) return [];
  if (Array.isArray(group)) {
    return group.flatMap((g) => g.field || g.fields || []);
  }
  if (isObj(group)) {
    return group.field || group.fields || [];
  }
  return [];
};

// ====================== unwrapValueShells (đã fix) ======================
const unwrapValueShells = (data) => {
  let v = data;

  // unwrap liên tục các lớp { value: ... }
  while (isObj(v) && Object.keys(v).length === 1 && 'value' in v) {
    v = v.value;
  }

  // unwrap nếu chỉ còn lại group kỹ thuật "group_0", "group_1", ...
  if (
    isObj(v) &&
    Object.keys(v).length === 1 &&
    /^group_\d+$/.test(Object.keys(v)[0])
  ) {
    v = v[Object.keys(v)[0]];
  }

  return v;
};

const normalizeLabelValue = (data) => {
  const v = unwrapValueShells(data);
  if (isObj(v) && 'label' in v && 'value' in v) {
    return { label: v.label, value: unwrapValueShells(v.value) };
  }
  return { label: null, value: v };
};

const isLabelValueGroup = (v) => isObj(v) && 'label' in v && 'value' in v;

// ====================== Recursive renderer for objects ======================
function RenderKeyValue({ obj, indicator, onImageClick, level = 0 }) {
  if (!isObj(obj)) return null;

  // Bỏ qua các key kỹ thuật (group_0, group_1, ...)
  const entries = Object.entries(obj)
    .filter(([k]) => !/^group_\d+$/.test(k))
    .filter(([_, v]) => hasValue(unwrapValueShells(v)));

  if (!entries.length) return null;

  return (
    <Box sx={{ pl: level ? 2 : 0 }}>
      {entries.map(([k, v], idx) => {
        const isLast = idx === entries.length - 1;
        const borderStyle = isLast ? 'none' : '1px solid #f0f0f0';

        // Nếu là group {label, value}
        if (isLabelValueGroup(v)) {
          const nv = normalizeLabelValue(v);
          if (!hasValue(nv.value)) return null;
          return (
            <Box key={k} sx={{ py: 1.5, borderBottom: borderStyle }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                {nv.label || k}
              </Typography>
              <Box sx={{ pl: 2, mt: 1 }}>
                <RenderKeyValue
                  obj={nv.value}
                  indicator={indicator}
                  level={level + 1}
                  onImageClick={onImageClick}
                />
              </Box>
            </Box>
          );
        }

        // Nếu là ảnh hoặc tên file ảnh (PNG, JPG, JPEG, WEBP)
        const imageUrls = findImageUrls(v);
        const fileNames =
          !imageUrls.length && Array.isArray(v)
            ? v.filter(
                (item) =>
                  typeof item === 'string' &&
                  /\.(png|jpg|jpeg|webp)$/i.test(item.trim())
              )
            : [];

        const allImages = [...imageUrls, ...fileNames];
        if (allImages.length > 0) {
          return (
            <Box key={k} sx={{ py: 1.5, borderBottom: borderStyle }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                {k}:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {allImages.map((rawUrl, idx2) => {
                  let url = rawUrl;

                  // Nếu chuỗi chứa blob URL dạng "filename; size; type; blob:http..."
                  if (typeof rawUrl === 'string' && rawUrl.includes('blob:')) {
                    const match = rawUrl.match(/blob:[^,;]+/);
                    if (match) url = match[0];
                  }

                  let resolvedSrc = url;
                  const BASE_URL = "https://drmayday.ibme.edu.vn/urticaria-data/medical-record";

                  // Đọc recordId & templateId từ object cha (nếu có)
                  const groupId = indicator?.groupId || indicator?.id || 28;
                  const templateId = indicator?.templateId || 17;

                  if (
                    !url.startsWith('http') &&
                    !url.startsWith('data:') &&
                    !url.startsWith('blob:')
                  ) {
                    resolvedSrc = `${BASE_URL}/${groupId}/${templateId}/${encodeURIComponent(url)}`;
                  }

                  return (
                    <Box
                      key={idx2}
                      component="img"
                      src={resolvedSrc}
                      alt={`${k} ${idx2 + 1}`}
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: 1.5,
                        objectFit: 'cover',
                        cursor: 'pointer',
                        border: '1px solid #ddd',
                      }}
                      onClick={() => onImageClick?.(allImages)}
                    />
                  );
                })}
              </Box>
            </Box>
          );
        }

        // Nếu là object lồng nhau
        if (isObj(v)) {
          const inner = (
            <RenderKeyValue
              obj={v}
              indicator={indicator}
              level={level + 1}
              onImageClick={onImageClick}
            />
          );
          if (!inner) return null;
          return (
            <Box key={k} sx={{ py: 1.5, borderBottom: borderStyle }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                {k}
              </Typography>
              <Box sx={{ pl: 2, mt: 1 }}>{inner}</Box>
            </Box>
          );
        }

        // Primitive / array
        const final = extractFinalValue(v);
        if (!hasValue(final)) return null;
        return (
          <Box
            key={k}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              py: 1.5,
              borderBottom: borderStyle,
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', pr: 2 }}>
              {k}
            </Typography>
            <Typography
              variant="body2"
              sx={{ textAlign: 'right', color: 'text.primary' }}
            >
              {Array.isArray(final) ? final.join(', ') : String(final)}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

// ====================== PUBLIC: QuestionViewer ======================
export function QuestionViewer({ indicator, value, onImageClick }) {
  const normalized = unwrapValueShells(value);

  // --- A) CUSTOM ---
  if (indicator.valueType === 'custom' && hasValue(normalized)) {
    const { label: groupLabel, value: groupValue } = normalizeLabelValue(normalized);

    if (isObj(groupValue)) {
      return (
        <Box sx={{ py: 1.5, borderBottom: '1px solid #f0f0f0' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            {indicator.name}:
          </Typography>
          {groupLabel ? (
            <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
              {groupLabel}
            </Typography>
          ) : null}
          <Box sx={{ pl: 2, mt: 1 }}>
            <RenderKeyValue
              obj={groupValue}
              indicator={indicator}
              onImageClick={onImageClick}
            />
          </Box>
        </Box>
      );
    }

    const subFields = findFieldsArray(indicator.valueOptions);
    if (!subFields.length) return null;

    return (
      <Box sx={{ py: 1.5, borderBottom: '1px solid #f0f0f0' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
          {indicator.name}:
        </Typography>
        <Box sx={{ pl: 2, mt: 1 }}>
          {subFields.map((field, index) => {
            const key = field.label;
            const raw = isObj(normalized) ? normalized[key] : undefined;
            const subVal = unwrapValueShells(getActualAnswer(raw));
            if (!hasValue(subVal)) return null;
            return (
              <QuestionViewer
                key={`${indicator.id}-${index}-${key}`}
                indicator={{
                  id: field.id || key,
                  name: key,
                  valueType: field.type,
                  valueOptions: field.options || field.option,
                }}
                value={subVal}
                onImageClick={onImageClick}
              />
            );
          })}
        </Box>
      </Box>
    );
  }

  // --- B) Ảnh ---
  const imageUrls = findImageUrls(normalized);
  if (imageUrls.length > 0) {
    return (
      <Box sx={{ py: 1.5, borderBottom: '1px solid #f0f0f0' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
          {indicator.name}:
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
          {imageUrls.map((url, index) => (
            <Box
              key={index}
              component="img"
              src={url}
              alt={`${indicator.name} ${index + 1}`}
              sx={{
                width: 80,
                height: 80,
                borderRadius: 1.5,
                objectFit: 'cover',
                cursor: 'pointer',
                border: '1px solid #ddd',
              }}
              onClick={() => onImageClick?.(imageUrls)}
            />
          ))}
        </Box>
      </Box>
    );
  }

  // --- C) Primitive ---
  const finalDisplayValue = extractFinalValue(normalized);
  if (!hasValue(finalDisplayValue)) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        py: 1.5,
        borderBottom: '1px solid #f0f0f0',
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', pr: 2 }}>
        {indicator.name || ':'}
      </Typography>
      <Typography variant="body2" sx={{ textAlign: 'right', color: 'text.primary' }}>
        {Array.isArray(finalDisplayValue)
          ? finalDisplayValue.join(', ')
          : String(finalDisplayValue)}
      </Typography>
    </Box>
  );
}
