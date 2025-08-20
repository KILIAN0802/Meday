'use client';

import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormGroup from '@mui/material/FormGroup';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';

import { RouterLink } from 'src/routes/components';
import { Form, Field } from 'src/components/hook-form';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { useTheme, useMediaQuery } from '@mui/material';
import { paths } from 'src/routes/paths';

// ----------------------------------------------------------------------

export function CreateChronic() {
    const theme = useTheme();
    const mdUp = useMediaQuery(theme.breakpoints.up('sm'));
    const headerOffset = (mdUp ? (theme.mixins?.toolbar?.minHeight || 64) : 56) + 8;
    const methods = useForm({
        mode: 'onChange',
        defaultValues: {
        // Thông tin cơ bản
        patientId: '',
        recordId: '',
        fullName: '',
        cccd: '',
        age: '',
        gender: '',                    // '0' | '1'
        phone: '',
        address: '',                   // 'thanh_thi' | 'nong_thon' | 'mien_bien' | 'vung_nui'
        recordOpenDate: '',
        visitDate: '',
        occupation: '',                // 'cong_nhan' | 'nong_dan' | 'hs-sv' | 'can_bo_cong_chuc' | 'khac'
        exposures: [],                 // ['hoa_chat','anh_sang','bui','khac','khong']

        // Bệnh án mạn tính lần 1
        has6Weeks: '',                 // 'co' | 'khong'
        urticariaForms: [],            // ['san_phu','phu_mach']
        firstOnsetWeeks: '',           // số tuần
        // Đợt 1
        course1FromMonth: '',
        course1FromYear: '',
        course1ToMonth: '',
        course1ToYear: '',
        course1Treated: '',            // 'co' | 'khong' | 'khong_nho'
        course1Response: '',           // 'khoi_hoan_toan'|'khong_khoi'|'giam'|'nang_len'
        course1SymptomChange: '',      // 'not_do'|'ngua'|'ca_hai'

        // Sẩn phù - Q5, Q6
        sp_when: '',                   // 'ngaunhien' | 'kichthich'
        sp_triggers: [],               // các yếu tố kích thích
        sp_worsen: [],                 // ['stress','thuc_an','giam_dau']
        sp_worsen_food_detail: '',
        sp_worsen_drug_detail: '',
        },
    });

    const { control } = methods;

    const urticariaForms = useWatch({ control, name: 'urticariaForms' });
    const spWhen = useWatch({ control, name: 'sp_when' });
    const course1Treated = useWatch({ control, name: 'course1Treated' });
    const course1Response = useWatch({ control, name: 'course1Response' });
    const spWorsen = useWatch({ control, name: 'sp_worsen' });

    const onSubmit = methods.handleSubmit((data) => {
        console.log('Submit chronic record:', data);
    });

    const fieldProps = { variant: 'outlined', InputLabelProps: { shrink: true }, fullWidth: true };

    // helpers
    const isSelected = (arr, v) => Array.isArray(arr) && arr.includes(v);

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
      
      <Grid container direction="column" spacing={2} sx={{ maxWidth: 640, mx: 'auto' }}>
        {/* THÔNG TIN CƠ BẢN */} <h1>Bệnh án mạn tính lần 1</h1>
        <Grid item><Field.Text name="patientId" label="Mã bệnh nhân" required {...fieldProps} /></Grid>
        <Grid item><Field.Text name="recordId" label="Mã hồ sơ" {...fieldProps} /></Grid>
        <Grid item><Field.Text name="fullName" label="Họ tên" required {...fieldProps} /></Grid>
        <Grid item><Field.Text name="cccd" label="CCCD" required {...fieldProps} /></Grid>
        <Grid item><Field.Text name="age" label="Tuổi (nếu <5 tuổi, ghi tháng)" {...fieldProps} /></Grid>

        {/* Giới (0/1) */}
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

        {/* Địa dư */}
        <Grid item>
          <Controller
            name="address"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth>
                <FormLabel>Địa dư</FormLabel>
                <RadioGroup {...field}>
                  <FormControlLabel value="thanh_thi" control={<Radio />} label="Thành thị" />
                  <FormControlLabel value="nong_thon"  control={<Radio />} label="Nông thôn" />
                  <FormControlLabel value="mien_bien"  control={<Radio />} label="Miền biển" />
                  <FormControlLabel value="vung_nui"   control={<Radio />} label="Vùng núi" />
                </RadioGroup>
              </FormControl>
            )}
          />
        </Grid>

        <Grid item><Field.Text name="recordOpenDate" label="Ngày mở hồ sơ" type="date" {...fieldProps} /></Grid>
        <Grid item><Field.Text name="visitDate" label="Ngày khám" type="date" {...fieldProps} /></Grid>

        {/* Nghề nghiệp */}
        <Grid item>
          <Controller
            name="occupation"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth>
                <FormLabel>Nghề nghiệp</FormLabel>
                <RadioGroup {...field}>
                  <FormControlLabel value="cong_nhan"        control={<Radio />} label="Công nhân" />
                  <FormControlLabel value="nong_dan"         control={<Radio />} label="Nông dân" />
                  <FormControlLabel value="hs-sv"            control={<Radio />} label="HS-SV" />
                  <FormControlLabel value="can_bo_cong_chuc" control={<Radio />} label="Cán bộ công chức" />
                  <FormControlLabel value="khac"             control={<Radio />} label="Khác" />
                </RadioGroup>
              </FormControl>
            )}
          />
        </Grid>

        {/* Tiền sử tiếp xúc (checkbox; 'Không' loại trừ) */}
        <Grid item>
          <Controller
            name="exposures"
            control={control}
            render={({ field }) => {
              const value = Array.isArray(field.value) ? field.value : [];
              const toggle = (opt) => (e) => {
                if (e.target.checked) {
                  if (opt === 'khong') return field.onChange(['khong']);
                  return field.onChange([...value.filter(v => v !== 'khong'), opt]);
                }
                field.onChange(value.filter(v => v !== opt));
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

        {/* BỆNH ÁN MẠN TÍNH LẦN 1 */}
        {/* 1) ≥ 6 tuần liên tục */}
        <Grid item>
          <Controller
            name="has6Weeks"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth>
                <FormLabel>Bạn đã có đợt liên tục ≥ 6 tuần chưa?</FormLabel>
                <RadioGroup {...field}>
                  <FormControlLabel value="co" control={<Radio />} label="Có" />
                  <FormControlLabel value="khong" control={<Radio />} label="Không" />
                </RadioGroup>
              </FormControl>
            )}
          />
        </Grid>

        {/* 2) Sẩn phù / Phù mạch (cho phép chọn cả hai) */}
        <Grid item>
          <Controller
            name="urticariaForms"
            control={control}
            render={({ field }) => {
              const value = Array.isArray(field.value) ? field.value : [];
              const toggle = (opt) => (e) => {
                if (e.target.checked) {
                  field.onChange([...new Set([...(value || []), opt])]);
                } else {
                  field.onChange(value.filter(v => v !== opt));
                }
              };
              return (
                <FormControl fullWidth>
                  <FormLabel>Biểu hiện</FormLabel>
                  <FormGroup>
                    <FormControlLabel control={<Checkbox checked={isSelected(value, 'san_phu')} onChange={toggle('san_phu')} />} label="Sẩn phù" />
                    <FormControlLabel control={<Checkbox checked={isSelected(value, 'phu_mach')} onChange={toggle('phu_mach')} />} label="Phù mạch" />
                  </FormGroup>
                </FormControl>
              );
            }}
          />
        </Grid>

        {/* 3) Lần đầu bị tổn thương (tuần) */}
        <Grid item><Field.Text name="firstOnsetWeeks" label="Lần đầu bị tổn thương (cách ... tuần)" {...fieldProps} /></Grid>

        {/* 4) Đợt 1 */}
        <Grid item><FormLabel>Đợt 1 (không bắt buộc nếu không có)</FormLabel></Grid>
        <Grid item><Field.Text name="course1FromMonth" label="Từ tháng" {...fieldProps} /></Grid>
        <Grid item><Field.Text name="course1FromYear" label="Từ năm*" {...fieldProps} /></Grid>
        <Grid item><Field.Text name="course1ToMonth" label="Đến tháng" {...fieldProps} /></Grid>
        <Grid item><Field.Text name="course1ToYear" label="Đến năm*" {...fieldProps} /></Grid>
        <Grid item>
          <Controller
            name="course1Treated"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth>
                <FormLabel>Có điều trị hay không?</FormLabel>
                <RadioGroup {...field}>
                  <FormControlLabel value="co"         control={<Radio />} label="Có" />
                  <FormControlLabel value="khong"      control={<Radio />} label="Không" />
                  <FormControlLabel value="khong_nho"  control={<Radio />} label="Không nhớ" />
                </RadioGroup>
              </FormControl>
            )}
          />
        </Grid>

        {course1Treated === 'co' && (
          <>
            <Grid item>
              <Controller
                name="course1Response"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <FormLabel>Tình trạng đáp ứng với thuốc</FormLabel>
                    <RadioGroup {...field}>
                      <FormControlLabel value="khoi_hoan_toan" control={<Radio />} label="Khỏi hoàn toàn" />
                      <FormControlLabel value="khong_khoi"      control={<Radio />} label="Không khỏi" />
                      <FormControlLabel value="giam"             control={<Radio />} label="Giảm" />
                      <FormControlLabel value="nang_len"         control={<Radio />} label="Nặng lên" />
                    </RadioGroup>
                  </FormControl>
                )}
              />
            </Grid>

            {(course1Response === 'giam' || course1Response === 'nang_len') && (
              <Grid item>
                <Controller
                  name="course1SymptomChange"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <FormLabel>Triệu chứng Giảm/Nặng lên là gì?</FormLabel>
                      <RadioGroup {...field}>
                        <FormControlLabel value="not_do" control={<Radio />} label="Nốt đỏ" />
                        <FormControlLabel value="ngua"   control={<Radio />} label="Ngứa" />
                        <FormControlLabel value="ca_hai" control={<Radio />} label="Cả hai" />
                      </RadioGroup>
                    </FormControl>
                  )}
                />
              </Grid>
            )}
          </>
        )}

        {/* SẨN PHÙ: Q5, Q6 (hiện nếu đã chọn Sẩn phù) */}
        {Array.isArray(urticariaForms) && urticariaForms.includes('san_phu') && (
          <>
            <Grid item>
              <Controller
                name="sp_when"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <FormLabel>Nốt đỏ xuất hiện khi nào?</FormLabel>
                    <RadioGroup {...field}>
                      <FormControlLabel value="ngaunhien"  control={<Radio />} label="Một cách ngẫu nhiên" />
                      <FormControlLabel value="kichthich"   control={<Radio />} label="Khi có các yếu tố kích thích" />
                    </RadioGroup>
                  </FormControl>
                )}
              />
            </Grid>

            {spWhen === 'kichthich' && (
              <Grid item>
                <Controller
                  name="sp_triggers"
                  control={control}
                  render={({ field }) => {
                    const value = Array.isArray(field.value) ? field.value : [];
                    const toggle = (opt) => (e) => {
                      if (e.target.checked) field.onChange([...new Set([...(value || []), opt])]);
                      else field.onChange(value.filter(v => v !== opt));
                    };
                    const checked = (opt) => value.includes(opt);
                    return (
                      <FormControl fullWidth>
                        <FormLabel>Các yếu tố kích thích</FormLabel>
                        <FormGroup>
                          <FormControlLabel control={<Checkbox checked={checked('gai_cha_xat_sau_tam')} onChange={toggle('gai_cha_xat_sau_tam')} />} label="Gãi, chà xát, sau tắm" />
                          <FormControlLabel control={<Checkbox checked={checked('ra_mo_hoi_van_dong')} onChange={toggle('ra_mo_hoi_van_dong')} />} label="Ra mồ hôi, +/- vận động" />
                          <FormControlLabel control={<Checkbox checked={checked('khong_mo_hoi_nuoc_nong_cay_nong_xuc_dong')} onChange={toggle('khong_mo_hoi_nuoc_nong_cay_nong_xuc_dong')} />} label="Không có mồ hôi, +/- ngâm nước nóng, ăn cay nóng, xúc động" />
                          <FormControlLabel control={<Checkbox checked={checked('lanh_nhiet_luong_tang')} onChange={toggle('lanh_nhiet_luong_tang')} />} label="Thời tiết lạnh + nhiệt lượng cơ thể tăng" />
                          <FormControlLabel control={<Checkbox checked={checked('mang_vat_nang')} onChange={toggle('mang_vat_nang')} />} label="Mang vật nặng" />
                          <FormControlLabel control={<Checkbox checked={checked('tiep_xuc_do_vat_lanh')} onChange={toggle('tiep_xuc_do_vat_lanh')} />} label="Tiếp xúc đồ vật lạnh" />
                          <FormControlLabel control={<Checkbox checked={checked('tiep_xuc_anh_sang')} onChange={toggle('tiep_xuc_anh_sang')} />} label="Tiếp xúc ánh sáng" />
                          <FormControlLabel control={<Checkbox checked={checked('do_rung')} onChange={toggle('do_rung')} />} label="Do rung" />
                          <FormControlLabel control={<Checkbox checked={checked('chat_cu_the')} onChange={toggle('chat_cu_the')} />} label="Do các chất cụ thể" />
                        </FormGroup>
                      </FormControl>
                    );
                  }}
                />
              </Grid>
            )}

            <Grid item>
              <Controller
                name="sp_worsen"
                control={control}
                render={({ field }) => {
                  const value = Array.isArray(field.value) ? field.value : [];
                  const toggle = (opt) => (e) => {
                    if (e.target.checked) field.onChange([...new Set([...(value || []), opt])]);
                    else field.onChange(value.filter(v => v !== opt));
                  };
                  const checked = (opt) => value.includes(opt);
                  return (
                    <FormControl fullWidth>
                      <FormLabel>Các yếu tố làm nặng lên</FormLabel>
                      <FormGroup>
                        <FormControlLabel control={<Checkbox checked={checked('stress')} onChange={toggle('stress')} />} label="Stress" />
                        <FormControlLabel control={<Checkbox checked={checked('thuc_an')} onChange={toggle('thuc_an')} />} label="Thức ăn" />
                        <FormControlLabel control={<Checkbox checked={checked('giam_dau')} onChange={toggle('giam_dau')} />} label="Chống viêm, giảm đau" />
                      </FormGroup>
                    </FormControl>
                  );
                }}
              />
            </Grid>

            {isSelected(spWorsen, 'thuc_an') && (
              <Grid item><Field.Text name="sp_worsen_food_detail" label="Thức ăn cụ thể" {...fieldProps} /></Grid>
            )}
            {isSelected(spWorsen, 'giam_dau') && (
              <Grid item><Field.Text name="sp_worsen_drug_detail" label="Tên thuốc cụ thể" {...fieldProps} /></Grid>
            )}
          </>
        )}

        {/* Nút lưu */}
        <Grid item sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 , padding:7}}>
          <Button type="submit" variant="contained">Lưu</Button>
        </Grid>

      </Grid>
    </Form>
    </>
  );
}
