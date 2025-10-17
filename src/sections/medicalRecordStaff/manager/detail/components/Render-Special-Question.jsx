'use client';
import { useState, useEffect } from 'react';
import { Checkbox, FormGroup, FormControlLabel, TextField, Select, MenuItem, Button } from '@mui/material';

export default function SpecialQuestionRenderer({ indicator, value, onChange }) {
  const [selected, setSelected] = useState(value || []);
  const [customValues, setCustomValues] = useState({});
  const [showExtra, setShowExtra] = useState(false);

  // --- Nhận diện loại đặc biệt ---
  const isTemplate16_17_Q4 = [190, 65].includes(indicator.id);
  const isTemplate16_17_Q5 = [196, 66].includes(indicator.id);
  const isTemplate16_17_Q11 = [185, 71].includes(indicator.id);

  useEffect(() => {
    if (isTemplate16_17_Q4) {
      setShowExtra(selected.includes('Khi có các yếu tố kích thích'));
    }
  }, [selected, isTemplate16_17_Q4]);

  // --- Handler chung ---
  const toggleOption = (opt) => {
    let updated = selected.includes(opt)
      ? selected.filter((v) => v !== opt)
      : [...selected, opt];
    setSelected(updated);
    onChange(updated);
  };

  const handleCustomInput = (label, val) => {
    const newCustom = { ...customValues, [label]: val };
    setCustomValues(newCustom);
    onChange({ selected, customValues: newCustom });
  };

  // --- Render nhóm câu 4 ---
  if (isTemplate16_17_Q4) {
    const baseOptions = [
      'Một cách ngẫu nhiên',
      'Khi có các yếu tố kích thích'
    ];
    const extraOptions = indicator.valueOptions.filter(
      (opt) => !baseOptions.includes(opt)
    );

    const optionsToShow = showExtra ? indicator.valueOptions : baseOptions;

    return (
      <FormGroup>
        {optionsToShow.map((opt) => (
          <FormControlLabel
            key={opt}
            control={
              <Checkbox
                checked={selected.includes(opt)}
                onChange={() => toggleOption(opt)}
              />
            }
            label={opt}
          />
        ))}
      </FormGroup>
    );
  }

  // --- Render nhóm câu 5 ---
  if (isTemplate16_17_Q5) {
    const baseOpts = ['Stress', 'Thức ăn', 'Chống viêm, giảm đau'];
    return (
      <div>
        <FormGroup>
          {baseOpts.map((opt) => (
            <FormControlLabel
              key={opt}
              control={
                <Checkbox
                  checked={selected.includes(opt)}
                  onChange={() => toggleOption(opt)}
                />
              }
              label={opt}
            />
          ))}
        </FormGroup>

        {selected.includes('Thức ăn') && (
          <TextField
            fullWidth
            label="Chi tiết thức ăn làm nặng bệnh"
            placeholder="Nhập chi tiết thức ăn làm nặng bệnh"
            value={customValues.food || ''}
            onChange={(e) => handleCustomInput('food', e.target.value)}
          />
        )}

        {selected.includes('Chống viêm, giảm đau') && (
          <TextField
            fullWidth
            label="Chi tiết thuốc làm nặng bệnh"
            placeholder="Nhập chi tiết thuốc làm nặng bệnh"
            value={customValues.medicine || ''}
            onChange={(e) => handleCustomInput('medicine', e.target.value)}
          />
        )}
      </div>
    );
  }

  // --- Render nhóm câu 11 ---
  if (isTemplate16_17_Q11) {
    const fields = indicator.valueOptions.group[0].field;
    const opts = [
      '< 1h',
      '1-6h',
      '6h-12h',
      '12-24h',
      'Không biết',
      'Khác (theo giờ)'
    ];

    return (
      <div className="space-y-4">
        {fields.map((f) => (
          <div key={f.label}>
            <label className="font-medium">{f.label}</label>
            <Select
              fullWidth
              size="small"
              value={customValues[f.label] || ''}
              onChange={(e) => handleCustomInput(f.label, e.target.value)}
            >
              {opts.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </Select>

            {customValues[f.label] === 'Khác (theo giờ)' && (
              <div className="flex items-center gap-2 mt-2">
                <TextField
                  size="small"
                  label="Nhập số giờ cụ thể"
                  value={customValues[`${f.label}_khac`] || ''}
                  onChange={(e) =>
                    handleCustomInput(`${f.label}_khac`, e.target.value)
                  }
                />
                <Button
                  variant="outlined"
                  onClick={() =>
                    handleCustomInput(`${f.label}_khac`, '1')
                  }
                >
                  +1h
                </Button>
                <Button
                  variant="outlined"
                  onClick={() =>
                    handleCustomInput(`${f.label}_khac`, '6')
                  }
                >
                  +6h
                </Button>
                <Button
                  variant="outlined"
                  onClick={() =>
                    handleCustomInput(`${f.label}_khac`, '12')
                  }
                >
                  +12h
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return null;
}