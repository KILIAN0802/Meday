'use client';

import { useEffect } from 'react';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormGroup from '@mui/material/FormGroup';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import { useRouter } from 'next/navigation';

import { Form, Field } from 'src/components/hook-form';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { useTheme, useMediaQuery } from '@mui/material';
import { RouterLink } from 'src/routes/components';
import { paths } from 'src/routes/paths';

// ----------------------------------------------------------------------

export function CreateAcute() {
    const router = useRouter();

    const theme = useTheme();
    const mdUp = useMediaQuery(theme.breakpoints.up('sm'));
    const headerOffset = (mdUp ? (theme.mixins?.toolbar?.minHeight || 64) : 56) + 8; // +8px margin
  const methods = useForm({
    mode: 'onChange',
    defaultValues: {
      // Thông tin cơ bản
      patientId: '', recordId: '', fullName: '', cccd: '', age: '',
      gender: '', phone: '', address: '', recordOpenDate: '', visitDate: '',
      occupation: '', exposures: [],

      // Cấp tính
      has6Weeks: '', forms: [],              // ['san_phu','phu_mach']
      firstOnsetWeeks: '',
      // Đợt 1/2/3
      c1_from_month: '', c1_from_year: '', c1_to_month: '', c1_to_year: '', c1_treated: '', c1_response: '', c1_symptom_change: '',
      c2_from_month: '', c2_from_year: '', c2_to_month: '', c2_to_year: '', c2_treated: '', c2_response: '', c2_symptom_change: '',
      c3_from_month: '', c3_from_year: '', c3_to_month: '', c3_to_year: '', c3_treated: '', c3_response: '', c3_symptom_change: '',
      // Đợt hiện tại
      curr_from_month: '', curr_from_year: '', curr_to_month: '', curr_to_year: '',
      curr_drugs_name: '', curr_drugs_time: '', curr_drugs_dose: '',

      // Sẩn phù: yếu tố
      sp_when: '', sp_triggers: [], sp_worsen: [], sp_worsen_food_detail: '', sp_worsen_drug_detail: '',
      // Sẩn phù: vị trí + ảnh
      sp_locations: [],
      photo_mat_thang: null, photo_mat_nghieng_trai: null, photo_mat_nghieng_phai: null, photo_mieng: null,
      photo_than_truoc: null, photo_than_sau: null,
      photo_bantay_mu: null, photo_bantay_long: null,
      photo_cangtay_trong: null, photo_cangtay_ngoai: null,
      photo_canh_tay_trong: null, photo_canh_tay_ngoai: null,
      photo_sinh_duc: null,
      photo_dui_trong: null, photo_dui_ngoai: null,
      photo_cangchan_trong: null, photo_cangchan_ngoai: null,
      photo_banchan_mu: null, photo_banchan_long: null,

      // Sẩn phù: đặc điểm
      sp_size_on: '', sp_size_off: '', sp_border: '', sp_shape: '',
      sp_colors: [], sp_duration_on: '', sp_duration_off: '',
      sp_surface_vay: '', sp_surface_mun: '', sp_surface_gianmach: '',
      sp_time_of_day: '', sp_daily_count: '', sp_sensations: [],

      // Phù mạch: tổng lần, vị trí + ảnh, đặc điểm
      pm_total_times: '', pm_locations: [],
      pm_photo_mat: null, pm_photo_moi: null, pm_photo_luoi: null,
      pm_photo_sinh_duc: null, pm_photo_ban_tay: null, pm_photo_ban_chan: null, pm_photo_khac: null,
      pm_surface_vay: '', pm_surface_mun: '', pm_surface_gianmach: '',
      pm_duration_on: '', pm_duration_off: '', pm_time_of_day: '', pm_sensations: [],

      // Yếu tố khởi phát & tiền sử
      trigger_infection: '', trigger_food: '', trigger_drug: '', trigger_insect: '', trigger_other: '',
      hx_allergy: '', hx_drug: '', hx_urticaria: '', hx_other: '',

      // Khám & CLS
      fever: '', fever_temp: '', pulse: '', bp: '',
      other_organs_abn: '', other_organs_detail: '',
      lab_wbc: '', lab_neu: '', lab_crp: '', lab_ige: '', lab_other: '',

      // Chẩn đoán & điều trị
      dx_provisional: '', dx_final: '',
      treat_h1_name1: '', treat_h1_dose1: '', treat_h1_name2: '', treat_h1_dose2: '',
      treat_cs_name: '', treat_cs_dose: '',
      admit: '', followup_date: '',
    },
  });

  const { control } = methods;

  // Watches
  const spLocations = useWatch({ control, name: 'sp_locations' }) || [];
  const pmLocations = useWatch({ control, name: 'pm_locations' }) || [];
  const fever = useWatch({ control, name: 'fever' });
  const otherOrgansAbn = useWatch({ control, name: 'other_organs_abn' });

  const onSubmit = methods.handleSubmit((data) => {
    console.log('Submit acute record:', data);
  });

  const fieldProps = { variant: 'outlined', InputLabelProps: { shrink: true }, fullWidth: true };

  // Map vị trí -> (field file, label) cho SẨN PHÙ
  const SP_LOCATION_UPLOADS = [
    { value: 'mat_thang', file: 'photo_mat_thang', label: 'Ảnh: Mặt thẳng' },
    { value: 'mat_nghieng_trai', file: 'photo_mat_nghieng_trai', label: 'Ảnh: Mặt nghiêng trái' },
    { value: 'mat_nghieng_phai', file: 'photo_mat_nghieng_phai', label: 'Ảnh: Mặt nghiêng phải' },
    { value: 'mieng', file: 'photo_mieng', label: 'Ảnh: Miệng' },
    { value: 'than_truoc', file: 'photo_than_truoc', label: 'Ảnh: Thân trước' },
    { value: 'than_sau', file: 'photo_than_sau', label: 'Ảnh: Thân sau' },
    { value: 'bantay_mu', file: 'photo_bantay_mu', label: 'Ảnh: Bàn tay - mặt mu' },
    { value: 'bantay_long', file: 'photo_bantay_long', label: 'Ảnh: Bàn tay - mặt lòng' },
    { value: 'cangtay_trong', file: 'photo_cangtay_trong', label: 'Ảnh: Cẳng tay - mặt trong' },
    { value: 'cangtay_ngoai', file: 'photo_cangtay_ngoai', label: 'Ảnh: Cẳng tay - mặt ngoài' },
    { value: 'canhtay_trong', file: 'photo_canh_tay_trong', label: 'Ảnh: Cánh tay - mặt trong' },
    { value: 'canhtay_ngoai', file: 'photo_canh_tay_ngoai', label: 'Ảnh: Cánh tay - mặt ngoài' },
    { value: 'sinh_duc', file: 'photo_sinh_duc', label: 'Ảnh: Sinh dục' },
    { value: 'dui_trong', file: 'photo_dui_trong', label: 'Ảnh: Đùi - mặt trong' },
    { value: 'dui_ngoai', file: 'photo_dui_ngoai', label: 'Ảnh: Đùi - mặt ngoài' },
    { value: 'cangchan_trong', file: 'photo_cangchan_trong', label: 'Ảnh: Cẳng chân - mặt trong' },
    { value: 'cangchan_ngoai', file: 'photo_cangchan_ngoai', label: 'Ảnh: Cẳng chân - mặt ngoài' },
    { value: 'banchan_mu', file: 'photo_banchan_mu', label: 'Ảnh: Bàn chân - mặt mu' },
    { value: 'banchan_long', file: 'photo_banchan_long', label: 'Ảnh: Bàn chân - mặt lòng' },
  ];

  // Map vị trí -> (field file, label) cho PHÙ MẠCH (không ảnh cho 'thanh_quan')
  const PM_LOCATION_UPLOADS = [
    { value: 'mat', file: 'pm_photo_mat', label: 'Ảnh: Mắt' },
    { value: 'moi', file: 'pm_photo_moi', label: 'Ảnh: Môi' },
    { value: 'luoi', file: 'pm_photo_luoi', label: 'Ảnh: Lưỡi' },
    { value: 'sinh_duc', file: 'pm_photo_sinh_duc', label: 'Ảnh: Sinh dục' },
    { value: 'ban_tay', file: 'pm_photo_ban_tay', label: 'Ảnh: Bàn tay' },
    { value: 'ban_chan', file: 'pm_photo_ban_chan', label: 'Ảnh: Bàn chân' },
    { value: 'khac', file: 'pm_photo_khac', label: 'Ảnh: Khác' },
  ];

  // Clear file khi bỏ tích vị trí
  useEffect(() => {
    SP_LOCATION_UPLOADS.forEach(({ value, file }) => {
      if (!spLocations.includes(value) && methods.getValues(file)) {
        methods.setValue(file, null, { shouldDirty: true });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spLocations]);

  useEffect(() => {
    PM_LOCATION_UPLOADS.forEach(({ value, file }) => {
      if (!pmLocations.includes(value) && methods.getValues(file)) {
        methods.setValue(file, null, { shouldDirty: true });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pmLocations]);

  // Helpers
  const MultiCheck = ({ name, options }) => (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const value = Array.isArray(field.value) ? field.value : [];
        const toggle = (opt) => (e) => {
          if (e.target.checked) field.onChange([...new Set([...(value || []), opt])]);
          else field.onChange(value.filter((v) => v !== opt));
        };
        return (
          <FormGroup>
            {options.map((opt) => (
              <FormControlLabel
                key={opt.value}
                control={<Checkbox checked={value.includes(opt.value)} onChange={toggle(opt.value)} />}
                label={opt.label}
              />
            ))}
          </FormGroup>
        );
      }}
    />
  );

  const TriRadio = ({ name, label }) => (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <FormControl fullWidth>
          <FormLabel>{label}</FormLabel>
          <RadioGroup {...field}>
            <FormControlLabel value="co" control={<Radio />} label="Có" />
            <FormControlLabel value="khong" control={<Radio />} label="Không" />
            <FormControlLabel value="kbiet" control={<Radio />} label="Không biết" />
          </RadioGroup>
        </FormControl>
      )}
    />
  );

  const Episode = (prefix, label) => (
    <>
      <Grid item><FormLabel>{label}</FormLabel></Grid>
      <Grid item><Field.Text name={`${prefix}_from_month`} label="Từ tháng" {...fieldProps} /></Grid>
      <Grid item><Field.Text name={`${prefix}_from_year`} label="Từ năm*" {...fieldProps} /></Grid>
      <Grid item><Field.Text name={`${prefix}_to_month`} label="Đến tháng" {...fieldProps} /></Grid>
      <Grid item><Field.Text name={`${prefix}_to_year`} label="Đến năm*" {...fieldProps} /></Grid>

      <Grid item>
        <Controller
          name={`${prefix}_treated`}
          control={control}
          render={({ field }) => (
            <FormControl fullWidth>
              <FormLabel>Có điều trị hay không?</FormLabel>
              <RadioGroup {...field}>
                <FormControlLabel value="co" control={<Radio />} label="Có" />
                <FormControlLabel value="khong" control={<Radio />} label="Không" />
                <FormControlLabel value="khong_nho" control={<Radio />} label="Không nhớ" />
              </RadioGroup>
            </FormControl>
          )}
        />
      </Grid>

      <Grid item>
        <Controller
          name={`${prefix}_response`}
          control={control}
          render={({ field }) => (
            <FormControl fullWidth>
              <FormLabel>Tình trạng đáp ứng với thuốc</FormLabel>
              <RadioGroup {...field}>
                <FormControlLabel value="khoi_hoan_toan" control={<Radio />} label="Khỏi hoàn toàn" />
                <FormControlLabel value="khong_khoi" control={<Radio />} label="Không khỏi" />
                <FormControlLabel value="giam" control={<Radio />} label="Giảm" />
                <FormControlLabel value="nang_len" control={<Radio />} label="Nặng lên" />
              </RadioGroup>
            </FormControl>
          )}
        />
      </Grid>

      <Grid item>
        <Controller
          name={`${prefix}_symptom_change`}
          control={control}
          render={({ field }) => (
            <FormControl fullWidth>
              <FormLabel>Triệu chứng Giảm/Nặng lên</FormLabel>
              <RadioGroup {...field}>
                <FormControlLabel value="not_do" control={<Radio />} label="Nốt đỏ" />
                <FormControlLabel value="ngua" control={<Radio />} label="Ngứa" />
                <FormControlLabel value="ca_hai" control={<Radio />} label="Cả hai" />
              </RadioGroup>
            </FormControl>
          )}
        />
      </Grid>
    </>
  );

  const FileInput = ({ name, label }) => (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <FormControl fullWidth>
          <FormLabel>{label}</FormLabel>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => field.onChange(e.target.files ? e.target.files[0] : null)}
          />
        </FormControl>
      )}
    />
  );

  return (
    <>
    <Button
        component={RouterLink} 
        href = {paths.dashboard.MedicalRecords.create}
        variant="outlined"
        sx={{
            position: 'fixed',
            top: headerOffset,       // luôn nằm ngay dưới header
            right: 16,
            zIndex: (t) => t.zIndex.tooltip + 1,
        }}
        >
        Quay lại
    </Button>

      <Form methods={methods} onSubmit={onSubmit} sx={{ width: '100%' }}>
        <Grid container direction="column" spacing={2} sx={{ maxWidth: 720, mx: 'auto' }}>
        <h1 >Bệnh án cấp tính</h1>
          {/* ===== 1) Thông tin cơ bản ===== */}
          <Grid item><Field.Text name="patientId" label="Mã bệnh nhân" required {...fieldProps} /></Grid>
          <Grid item><Field.Text name="recordId" label="Mã hồ sơ" {...fieldProps} /></Grid>
          <Grid item><Field.Text name="fullName" label="Họ tên" required {...fieldProps} /></Grid>
          <Grid item><Field.Text name="cccd" label="CCCD" required {...fieldProps} /></Grid>
          <Grid item><Field.Text name="age" label="Tuổi (<5 tuổi ghi tháng)" {...fieldProps} /></Grid>

          <Grid item>
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <FormLabel>Giới</FormLabel>
                  <RadioGroup {...field}>
                    <FormControlLabel value="0" control={<Radio />} label="Nam" />
                    <FormControlLabel value="1" control={<Radio />} label="Nữ" />
                  </RadioGroup>
                </FormControl>
              )}
            />
          </Grid>

          <Grid item><Field.Text name="phone" label="Điện thoại" required {...fieldProps} /></Grid>

          <Grid item>
            <Controller
              name="address"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <FormLabel>Địa dư</FormLabel>
                  <RadioGroup {...field}>
                    <FormControlLabel value="thanh_thi" control={<Radio />} label="Thành thị" />
                    <FormControlLabel value="nong_thon" control={<Radio />} label="Nông thôn" />
                    <FormControlLabel value="mien_bien" control={<Radio />} label="Miền biển" />
                    <FormControlLabel value="vung_nui" control={<Radio />} label="Vùng núi" />
                  </RadioGroup>
                </FormControl>
              )}
            />
          </Grid>

          <Grid item><Field.Text name="recordOpenDate" label="Ngày mở hồ sơ" type="date" {...fieldProps} /></Grid>
          <Grid item><Field.Text name="visitDate" label="Ngày khám" type="date" {...fieldProps} /></Grid>

          <Grid item>
            <Controller
              name="occupation"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <FormLabel>Nghề nghiệp</FormLabel>
                  <RadioGroup {...field}>
                    <FormControlLabel value="cong_nhan" control={<Radio />} label="Công nhân" />
                    <FormControlLabel value="nong_dan" control={<Radio />} label="Nông dân" />
                    <FormControlLabel value="hs-nv" control={<Radio />} label="HS-NV" />
                    <FormControlLabel value="can_bo_cong_chuc" control={<Radio />} label="Cán bộ công chức" />
                    <FormControlLabel value="khac" control={<Radio />} label="Khác" />
                  </RadioGroup>
                </FormControl>
              )}
            />
          </Grid>

          <Grid item>
            <Controller
              name="exposures"
              control={control}
              render={({ field }) => {
                const value = Array.isArray(field.value) ? field.value : [];
                const toggle = (opt) => (e) => {
                  if (e.target.checked) {
                    if (opt === 'khong') return field.onChange(['khong']);
                    return field.onChange([...value.filter((v) => v !== 'khong'), opt]);
                  }
                  field.onChange(value.filter((v) => v !== opt));
                };
                const checked = (opt) => value.includes(opt);
                return (
                  <FormControl fullWidth>
                    <FormLabel>Tiền sử tiếp xúc</FormLabel>
                    <FormGroup>
                      <FormControlLabel control={<Checkbox checked={checked('hoa_chat')} onChange={toggle('hoa_chat')} />} label="Tiếp xúc hóa chất" />
                      <FormControlLabel control={<Checkbox checked={checked('anh_sang')} onChange={toggle('anh_sang')} />} label="Tiếp xúc ánh sáng" />
                      <FormControlLabel control={<Checkbox checked={checked('bui')} onChange={toggle('bui')} />} label="Tiếp xúc bụi" />
                      <FormControlLabel control={<Checkbox checked={checked('khac')} onChange={toggle('khac')} />} label="Khác" />
                      <FormControlLabel control={<Checkbox checked={checked('khong')} onChange={toggle('khong')} />} label="Không" />
                    </FormGroup>
                  </FormControl>
                );
              }}
            />
          </Grid>

          {/* ===== 2) Bệnh án cấp tính ===== */}
          <Grid item>
            <Controller
              name="has6Weeks"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <FormLabel>Đợt liên tục ≥ 6 tuần?</FormLabel>
                  <RadioGroup {...field}>
                    <FormControlLabel value="co" control={<Radio />} label="Có" />
                    <FormControlLabel value="khong" control={<Radio />} label="Không" />
                  </RadioGroup>
                </FormControl>
              )}
            />
          </Grid>

          <Grid item>
            <Controller
              name="forms"
              control={control}
              render={({ field }) => {
                const value = Array.isArray(field.value) ? field.value : [];
                const toggle = (opt) => (e) => {
                  if (e.target.checked) field.onChange([...new Set([...(value || []), opt])]);
                  else field.onChange(value.filter((v) => v !== opt));
                };
                return (
                  <FormControl fullWidth>
                    <FormLabel>Biểu hiện</FormLabel>
                    <FormGroup>
                      <FormControlLabel control={<Checkbox checked={value.includes('san_phu')} onChange={toggle('san_phu')} />} label="Sẩn phù" />
                      <FormControlLabel control={<Checkbox checked={value.includes('phu_mach')} onChange={toggle('phu_mach')} />} label="Phù mạch" />
                    </FormGroup>
                  </FormControl>
                );
              }}
            />
          </Grid>

          {/* ===== Sẩn phù ===== */}
          <Grid item><Field.Text name="firstOnsetWeeks" label="Lần đầu bị tổn thương (cách ... tuần)" {...fieldProps} /></Grid>

          {Episode('c1', 'Đợt 1')}
          {Episode('c2', 'Đợt 2')}
          {Episode('c3', 'Đợt 3')}

          <Grid item><FormLabel>Đợt này</FormLabel></Grid>
          <Grid item><Field.Text name="curr_from_month" label="Từ tháng*" {...fieldProps} /></Grid>
          <Grid item><Field.Text name="curr_from_year" label="Từ năm*" {...fieldProps} /></Grid>
          <Grid item><Field.Text name="curr_to_month" label="Đến tháng*" {...fieldProps} /></Grid>
          <Grid item><Field.Text name="curr_to_year" label="Đến năm*" {...fieldProps} /></Grid>
          <Grid item><Field.Text name="curr_drugs_name" label="Tên thuốc đã sử dụng" {...fieldProps} /></Grid>
          <Grid item><Field.Text name="curr_drugs_time" label="Thời gian sử dụng" {...fieldProps} /></Grid>
          <Grid item><Field.Text name="curr_drugs_dose" label="Liều dùng" {...fieldProps} /></Grid>

          <Grid item>
            <Controller
              name="sp_when"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <FormLabel>Nốt đỏ xuất hiện khi nào?</FormLabel>
                  <RadioGroup {...field}>
                    <FormControlLabel value="ngaunhien" control={<Radio />} label="Một cách ngẫu nhiên" />
                    <FormControlLabel value="kichthich" control={<Radio />} label="Khi có các yếu tố kích thích" />
                  </RadioGroup>
                </FormControl>
              )}
            />
          </Grid>

          <Grid item>
            <MultiCheck
              name="sp_triggers"
              options={[
                { value: 'gai_cha_xat_sau_tam', label: 'Gãi, chà xát, sau tắm' },
                { value: 'ra_mo_hoi_van_dong', label: 'Ra mồ hôi, +/- vận động' },
                { value: 'khong_mo_hoi_nuoc_nong_cay_nong_xuc_dong', label: 'Không mồ hôi, +/- nước nóng/đồ cay/xúc động' },
                { value: 'lanh_nhiet_luong_tang', label: 'Lạnh + nhiệt lượng cơ thể tăng' },
                { value: 'mang_vat_nang', label: 'Mang vật nặng' },
                { value: 'tiep_xuc_do_vat_lanh', label: 'Tiếp xúc đồ vật lạnh' },
                { value: 'tiep_xuc_anh_sang', label: 'Tiếp xúc ánh sáng' },
                { value: 'do_rung', label: 'Do rung' },
                { value: 'chat_cu_the', label: 'Do các chất cụ thể' },
              ]}
            />
          </Grid>

          <Grid item>
            <MultiCheck
              name="sp_worsen"
              options={[
                { value: 'stress', label: 'Stress' },
                { value: 'thuc_an', label: 'Thức ăn' },
                { value: 'giam_dau', label: 'Chống viêm, giảm đau' },
              ]}
            />
          </Grid>
          <Grid item><Field.Text name="sp_worsen_food_detail" label="Thức ăn cụ thể (nếu có)" {...fieldProps} /></Grid>
          <Grid item><Field.Text name="sp_worsen_drug_detail" label="Tên thuốc cụ thể (nếu có)" {...fieldProps} /></Grid>

          {/* Vị trí nốt đỏ + Upload ảnh theo vị trí đã tích */}
          <Grid item>
            <FormLabel>Vị trí nốt đỏ (Sẩn phù)</FormLabel>
            <MultiCheck
              name="sp_locations"
              options={[
                { value: 'mat_thang', label: 'Mặt thẳng' },
                { value: 'mat_nghieng_trai', label: 'Mặt nghiêng trái' },
                { value: 'mat_nghieng_phai', label: 'Mặt nghiêng phải' },
                { value: 'mieng', label: 'Miệng' },
                { value: 'than_truoc', label: 'Thân trước' },
                { value: 'than_sau', label: 'Thân sau' },
                { value: 'bantay_mu', label: 'Bàn tay - mặt mu (2 tay)' },
                { value: 'bantay_long', label: 'Bàn tay - mặt lòng (2 tay)' },
                { value: 'cangtay_trong', label: 'Cẳng tay - mặt trong' },
                { value: 'cangtay_ngoai', label: 'Cẳng tay - mặt ngoài' },
                { value: 'canhtay_trong', label: 'Cánh tay - mặt trong' },
                { value: 'canhtay_ngoai', label: 'Cánh tay - mặt ngoài' },
                { value: 'sinh_duc', label: 'Sinh dục' },
                { value: 'dui_trong', label: 'Đùi - mặt trong' },
                { value: 'dui_ngoai', label: 'Đùi - mặt ngoài' },
                { value: 'cangchan_trong', label: 'Cẳng chân - mặt trong' },
                { value: 'cangchan_ngoai', label: 'Cẳng chân - mặt ngoài' },
                { value: 'banchan_mu', label: 'Bàn chân - mặt mu (2 chân)' },
                { value: 'banchan_long', label: 'Bàn chân - mặt lòng (2 chân)' },
              ]}
            />
          </Grid>

          {SP_LOCATION_UPLOADS.filter(x => spLocations.includes(x.value)).map(x => (
            <Grid item key={x.value}>
              <FileInput name={x.file} label={x.label} />
            </Grid>
          ))}

          {/* Đặc điểm nốt đỏ */}
          <Grid item>
            <FormLabel>Kích thước trung bình (dùng thuốc)</FormLabel>
            <Controller
              name="sp_size_on"
              control={control}
              render={({ field }) => (
                <RadioGroup {...field}>
                  <FormControlLabel value="<3" control={<Radio />} label="<3mm" />
                  <FormControlLabel value="3-10" control={<Radio />} label="3–10mm" />
                  <FormControlLabel value="10-50" control={<Radio />} label="10–50mm" />
                  <FormControlLabel value=">50" control={<Radio />} label=">50mm" />
                </RadioGroup>
              )}
            />
          </Grid>
          <Grid item>
            <FormLabel>Kích thước trung bình (không dùng thuốc)</FormLabel>
            <Controller
              name="sp_size_off"
              control={control}
              render={({ field }) => (
                <RadioGroup {...field}>
                  <FormControlLabel value="<3" control={<Radio />} label="<3mm" />
                  <FormControlLabel value="3-10" control={<Radio />} label="3–10mm" />
                  <FormControlLabel value="10-50" control={<Radio />} label="10–50mm" />
                  <FormControlLabel value=">50" control={<Radio />} label=">50mm" />
                </RadioGroup>
              )}
            />
          </Grid>

          <Grid item>
            <FormLabel>Ranh giới nốt đỏ</FormLabel>
            <Controller
              name="sp_border"
              control={control}
              render={({ field }) => (
                <RadioGroup {...field}>
                  <FormControlLabel value="co" control={<Radio />} label="Có bờ" />
                  <FormControlLabel value="khong" control={<Radio />} label="Không bờ" />
                </RadioGroup>
              )}
            />
          </Grid>

          <Grid item>
            <FormLabel>Hình dạng</FormLabel>
            <Controller
              name="sp_shape"
              control={control}
              render={({ field }) => (
                <RadioGroup {...field}>
                  <FormControlLabel value="tron_oval" control={<Radio />} label="Tròn/Oval" />
                  <FormControlLabel value="dai" control={<Radio />} label="Dài" />
                  <FormControlLabel value="khac" control={<Radio />} label="Hình dạng khác" />
                </RadioGroup>
              )}
            />
          </Grid>

          <Grid item>
            <FormLabel>Màu sắc (chọn nhiều)</FormLabel>
            <MultiCheck
              name="sp_colors"
              options={[
                { value: 'trung_mau_da', label: 'Trùng màu da' },
                { value: 'do_hong', label: 'Đỏ hồng' },
                { value: 'trang', label: 'Trắng' },
                { value: 'xuat_huyet', label: 'Xuất huyết (đỏ đậm, tím)' },
                { value: 'quang_trang', label: 'Có quầng trắng quanh nốt đỏ' },
              ]}
            />
          </Grid>

          <Grid item>
            <FormLabel>Thời gian tồn tại 1 nốt (dùng thuốc)</FormLabel>
            <Controller
              name="sp_duration_on"
              control={control}
              render={({ field }) => (
                <RadioGroup {...field}>
                  <FormControlLabel value="<1h" control={<Radio />} label="<1h" />
                  <FormControlLabel value="1-6h" control={<Radio />} label="1–6h" />
                  <FormControlLabel value="6-12h" control={<Radio />} label="6–12h" />
                  <FormControlLabel value="12-24h" control={<Radio />} label="12–24h" />
                  <FormControlLabel value="kbiet" control={<Radio />} label="Không biết" />
                </RadioGroup>
              )}
            />
          </Grid>
          <Grid item>
            <FormLabel>Thời gian tồn tại 1 nốt (không dùng thuốc)</FormLabel>
            <Controller
              name="sp_duration_off"
              control={control}
              render={({ field }) => (
                <RadioGroup {...field}>
                  <FormControlLabel value="<1h" control={<Radio />} label="<1h" />
                  <FormControlLabel value="1-6h" control={<Radio />} label="1–6h" />
                  <FormControlLabel value="6-12h" control={<Radio />} label="6–12h" />
                  <FormControlLabel value="12-24h" control={<Radio />} label="12–24h" />
                  <FormControlLabel value="kbiet" control={<Radio />} label="Không biết" />
                </RadioGroup>
              )}
            />
          </Grid>

          {/* Bề mặt */}
          <Grid item>
            <FormLabel>Đặc điểm bề mặt</FormLabel>
            <Controller
              name="sp_surface_vay"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <FormLabel>Có vảy?</FormLabel>
                  <RadioGroup {...field}>
                    <FormControlLabel value="co" control={<Radio />} label="Có vảy" />
                    <FormControlLabel value="khong" control={<Radio />} label="Không vảy" />
                  </RadioGroup>
                </FormControl>
              )}
            />
          </Grid>
          <Grid item>
            <Controller
              name="sp_surface_mun"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <FormLabel>Có mụn nước?</FormLabel>
                  <RadioGroup {...field}>
                    <FormControlLabel value="co" control={<Radio />} label="Có mụn nước" />
                    <FormControlLabel value="khong" control={<Radio />} label="Không mụn nước" />
                  </RadioGroup>
                </FormControl>
              )}
            />
          </Grid>
          <Grid item>
            <Controller
              name="sp_surface_gianmach"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <FormLabel>Có giãn mạch?</FormLabel>
                  <RadioGroup {...field}>
                    <FormControlLabel value="co" control={<Radio />} label="Có giãn mạch" />
                    <FormControlLabel value="khong" control={<Radio />} label="Không giãn mạch" />
                  </RadioGroup>
                </FormControl>
              )}
            />
          </Grid>

          <Grid item>
            <FormLabel>Nốt đỏ thường xuất hiện thời gian nào?</FormLabel>
            <Controller
              name="sp_time_of_day"
              control={control}
              render={({ field }) => (
                <RadioGroup {...field}>
                  <FormControlLabel value="sang" control={<Radio />} label="Sáng" />
                  <FormControlLabel value="trua" control={<Radio />} label="Trưa" />
                  <FormControlLabel value="chieu" control={<Radio />} label="Chiều" />
                  <FormControlLabel value="toi" control={<Radio />} label="Tối" />
                  <FormControlLabel value="dem" control={<Radio />} label="Đêm" />
                  <FormControlLabel value="khong_cu_the" control={<Radio />} label="Không có thời điểm cụ thể" />
                </RadioGroup>
              )}
            />
          </Grid>

          <Grid item>
            <FormLabel>Số lượng nốt đỏ trung bình/ngày</FormLabel>
            <Controller
              name="sp_daily_count"
              control={control}
              render={({ field }) => (
                <RadioGroup {...field}>
                  <FormControlLabel value="0-20" control={<Radio />} label="0–20" />
                  <FormControlLabel value="21-50" control={<Radio />} label="21–50" />
                  <FormControlLabel value=">50" control={<Radio />} label=">50" />
                </RadioGroup>
              )}
            />
          </Grid>

          <Grid item>
            <FormLabel>Cảm giác tại vị trí nốt đỏ</FormLabel>
            <MultiCheck
              name="sp_sensations"
              options={[
                { value: 'ngua', label: 'Ngứa' },
                { value: 'bong_rat', label: 'Bỏng rát' },
                { value: 'tuc', label: 'Tức' },
                { value: 'dau', label: 'Đau' },
              ]}
            />
          </Grid>

          {/* ===== Phù mạch ===== */}
          <Grid item><Field.Text name="pm_total_times" label="Số lần bị sưng phù (từ trước đến nay)" {...fieldProps} /></Grid>

          <Grid item>
            <FormLabel>Vị trí sưng phù (Phù mạch)</FormLabel>
            <MultiCheck
              name="pm_locations"
              options={[
                { value: 'mat', label: 'Mắt' },
                { value: 'moi', label: 'Môi' },
                { value: 'luoi', label: 'Lưỡi' },
                { value: 'thanh_quan', label: 'Thanh quản' }, // không có ảnh
                { value: 'sinh_duc', label: 'Sinh dục' },
                { value: 'ban_tay', label: 'Bàn tay' },
                { value: 'ban_chan', label: 'Bàn chân' },
                { value: 'khac', label: 'Khác' },
              ]}
            />
          </Grid>

          {PM_LOCATION_UPLOADS.filter(x => pmLocations.includes(x.value)).map(x => (
            <Grid item key={x.value}>
              <FileInput name={x.file} label={x.label} />
            </Grid>
          ))}

          {/* ===== Yếu tố khởi phát & tiền sử ===== */}
          <Grid item><TriRadio name="trigger_infection" label="Triệu chứng nhiễm trùng" /></Grid>
          <Grid item><TriRadio name="trigger_food" label="Thức ăn" /></Grid>
          <Grid item><TriRadio name="trigger_drug" label="Thuốc" /></Grid>
          <Grid item><TriRadio name="trigger_insect" label="Côn trùng đốt" /></Grid>
          <Grid item><Field.Text name="trigger_other" label="Khác (ghi rõ)" {...fieldProps} /></Grid>

          <Grid item><TriRadio name="hx_allergy" label="Tiền sử dị ứng" /></Grid>
          <Grid item><TriRadio name="hx_drug" label="Tiền sử thuốc" /></Grid>
          <Grid item><TriRadio name="hx_urticaria" label="Tiền sử mày đay" /></Grid>
          <Grid item><Field.Text name="hx_other" label="Khác (ghi rõ)" {...fieldProps} /></Grid>

          {/* ===== Khám & cận lâm sàng ===== */}
          <Grid item>
            <Controller
              name="fever"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <FormLabel>Sốt</FormLabel>
                  <RadioGroup {...field}>
                    <FormControlLabel value="co" control={<Radio />} label="Có" />
                    <FormControlLabel value="khong" control={<Radio />} label="Không" />
                  </RadioGroup>
                </FormControl>
              )}
            />
          </Grid>
          {fever === 'co' && <Grid item><Field.Text name="fever_temp" label="Nhiệt độ (°C)" {...fieldProps} /></Grid>}
          <Grid item><Field.Text name="pulse" label="Mạch (lần/phút)" {...fieldProps} /></Grid>
          <Grid item><Field.Text name="bp" label="HA (mmHg)" {...fieldProps} /></Grid>

          <Grid item>
            <Controller
              name="other_organs_abn"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <FormLabel>Bất thường cơ quan khác</FormLabel>
                  <RadioGroup {...field}>
                    <FormControlLabel value="co" control={<Radio />} label="Có" />
                    <FormControlLabel value="khong" control={<Radio />} label="Không" />
                  </RadioGroup>
                </FormControl>
              )}
            />
          </Grid>
          {otherOrgansAbn === 'co' && (
            <Grid item><Field.Text name="other_organs_detail" label="Ghi rõ bất thường" {...fieldProps} /></Grid>
          )}

          {/* ===== Cận lâm sàng ===== */}
          <Grid item><Field.Text name="lab_wbc" label="WBC (G/L)" {...fieldProps} /></Grid>
          <Grid item><Field.Text name="lab_neu" label="NEU (G/L)" {...fieldProps} /></Grid>
          <Grid item><Field.Text name="lab_crp" label="CRP (mg/L)" {...fieldProps} /></Grid>
          <Grid item><Field.Text name="lab_ige" label="IgE toàn phần (Ku/L)" {...fieldProps} /></Grid>
          <Grid item><Field.Text name="lab_other" label="Xét nghiệm khác" {...fieldProps} /></Grid>

          {/* ===== Chẩn đoán & điều trị ===== */}
          <Grid item><Field.Text name="dx_provisional" label="Chẩn đoán sơ bộ" {...fieldProps} /></Grid>
          <Grid item><Field.Text name="dx_final" label="Chẩn đoán xác định" {...fieldProps} /></Grid>

          <Grid item><FormLabel>Thuốc kháng histamin H1</FormLabel></Grid>
          <Grid item><Field.Text name="treat_h1_name1" label="Tên thuốc 1" {...fieldProps} /></Grid>
          <Grid item><Field.Text name="treat_h1_dose1" label="Liều dùng 1" {...fieldProps} /></Grid>
          <Grid item><Field.Text name="treat_h1_name2" label="Tên thuốc 2" {...fieldProps} /></Grid>
          <Grid item><Field.Text name="treat_h1_dose2" label="Liều dùng 2" {...fieldProps} /></Grid>

          <Grid item><FormLabel>Corticoid toàn thân</FormLabel></Grid>
          <Grid item><Field.Text name="treat_cs_name" label="Tên thuốc" {...fieldProps} /></Grid>
          <Grid item><Field.Text name="treat_cs_dose" label="Liều dùng" {...fieldProps} /></Grid>

          <Grid item>
            <Controller
              name="admit"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <FormLabel>Nhập viện</FormLabel>
                  <RadioGroup {...field}>
                    <FormControlLabel value="co" control={<Radio />} label="Có" />
                    <FormControlLabel value="khong" control={<Radio />} label="Không" />
                  </RadioGroup>
                </FormControl>
              )}
            />
          </Grid>

          <Grid item><Field.Text name="followup_date" type="date" label="Hẹn khám lại" {...fieldProps} /></Grid>

          {/* ===== Nút Lưu ===== */}
          <Grid item sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, padding: 7}}>
            <Button type="submit" variant="contained">Lưu</Button>
          </Grid>
        </Grid>
      </Form>
    </>
  );
}
