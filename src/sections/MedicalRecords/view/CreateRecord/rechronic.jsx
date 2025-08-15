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
import { useForm, Controller } from 'react-hook-form';
import { useTheme, useMediaQuery } from '@mui/material';
import { paths } from 'src/routes/paths';

// ----------------------------------------------------------------------

export function CreateRechronic() {
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
        gender: '',                       // '0' | '1'
        phone: '',
        address: '',                      // 'thanh_thi' | 'nong_thon' | 'mien_bien' | 'vung_nui'
        recordOpenDate: '',
        visitDate: '',
        occupation: '',                   // 'cong_nhan'|'nong_dan'|'hs-sv'|'can_bo_cong_chuc'|'khac'
        exposures: [],                    // ['hoa_chat','anh_sang','bui','khac','khong']

        // Theo dõi điều trị / điểm số
        uas7_on_iss7: '',
        uas7_on_hss7: '',
        uas7_off_iss7: '',
        uas7_off_hss7: '',
        uctScore: '',
        actScore: '',

        // Mức độ đáp ứng điều trị (bác sĩ tích)
        treatmentResponse: '',            // 'kiem_soat_hoan_toan'|'kiem_soat_tot'|'kiem_soat_kem_nhe'|'kiem_soat_kem_tb'|'kiem_soat_kem_cao'

        // Tác dụng không mong muốn (bệnh nhân tích tại nhà)
        adverseEffects: [],               // mảng code
        adverseOther: '',

        // Triệu chứng khám hiện tại
        hasSanPhu: '',                    // 'co'|'khong'
        hasPhuMach: '',                   // 'co'|'khong'
        lesionLocation: '',
        aas7: '',
        anaphylaxisSymptoms: '',
        newComorbids: '',

        // KẾT QUẢ TEST
        // Da vẽ nổi
        dermographismResult: '',          // 'duong_tinh'|'am_tinh'
        fricScore: '',
        nrsItch_dermo: '',
        nrsPain_dermo: '',
        nrsBurn_dermo: '',
        // Temptest (mày đay do lạnh)
        coldTemptestResult: '',           // 'duong_tinh'|'am_tinh'
        coldPositiveTempC: '',
        nrsItch_coldTemp: '',
        nrsPain_coldTemp: '',
        nrsBurn_coldTemp: '',
        // Test cục đá
        iceCubeResult: '',                // 'duong_tinh'|'am_tinh'
        iceLatencyMin: '',
        nrsItch_ice: '',
        nrsPain_ice: '',
        nrsBurn_ice: '',
        // Choline (xe đạp lực kế)
        cholinergicResult: '',            // 'duong_tinh'|'am_tinh'
        cholinergicOnsetMin: '',
        nrsItch_cholin: '',
        nrsPain_cholin: '',
        nrsBurn_cholin: '',
        // CUSI
        cusiScore: '',
        otherEtiology: '',
        },
    });

  const onSubmit = methods.handleSubmit((data) => {
    console.log('Submit rechronic record:', data);
  });

  const fieldProps = { variant: 'outlined', InputLabelProps: { shrink: true }, fullWidth: true };

  // helper cho checkbox nhiều chọn
  const renderMultiCheckbox = (name, options) => (
    <Controller
      name={name}
      control={methods.control}
      render={({ field }) => {
        const value = Array.isArray(field.value) ? field.value : [];
        const toggle = (opt) => (e) => {
          if (e.target.checked) field.onChange([...new Set([...(value || []), opt])]);
          else field.onChange(value.filter(v => v !== opt));
        };
        const checked = (opt) => value.includes(opt);
        return (
          <FormGroup>
            {options.map((opt) => (
              <FormControlLabel
                key={opt.value}
                control={<Checkbox checked={checked(opt.value)} onChange={toggle(opt.value)} />}
                label={opt.label}
              />
            ))}
          </FormGroup>
        );
      }}
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
      <h1>Bệnh án mạn tính tái khám</h1>

        {/* ===== Thông tin cơ bản ===== */}
        <Grid item><Field.Text name="patientId" label="Mã bệnh nhân" required {...fieldProps} /></Grid>
        <Grid item><Field.Text name="recordId" label="Mã hồ sơ" {...fieldProps} /></Grid>
        <Grid item><Field.Text name="fullName" label="Họ tên" required {...fieldProps} /></Grid>
        <Grid item><Field.Text name="cccd" label="CCCD" required {...fieldProps} /></Grid>
        <Grid item><Field.Text name="age" label="Tuổi (<5 tuổi ghi tháng)" {...fieldProps} /></Grid>

        {/* Giới */}
        <Grid item>
          <Controller
            name="gender"
            control={methods.control}
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
            control={methods.control}
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
            control={methods.control}
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

        {/* Tiền sử tiếp xúc (nhiều chọn; 'Không' loại trừ) */}
        <Grid item>
          <Controller
            name="exposures"
            control={methods.control}
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

        {/* ===== UAS7 / UCT / ACT ===== */}
        <Grid item><FormLabel>Mức độ hoạt động bệnh UAS7 (khi dùng thuốc)</FormLabel></Grid>
        <Grid item><Field.Text name="uas7_on_iss7" label="ISS7 (on meds)" {...fieldProps} /></Grid>
        <Grid item><Field.Text name="uas7_on_hss7" label="HSS7 (on meds)" {...fieldProps} /></Grid>

        <Grid item><FormLabel>Mức độ hoạt động bệnh UAS7 (khi ngừng thuốc)</FormLabel></Grid>
        <Grid item><Field.Text name="uas7_off_iss7" label="ISS7 (off meds)" {...fieldProps} /></Grid>
        <Grid item><Field.Text name="uas7_off_hss7" label="HSS7 (off meds)" {...fieldProps} /></Grid>

        <Grid item><Field.Text name="uctScore" label="UCT (điểm)" {...fieldProps} /></Grid>
        <Grid item><Field.Text name="actScore" label="ACT (điểm)" {...fieldProps} /></Grid>

        {/* ===== Mức độ đáp ứng điều trị ===== */}
        <Grid item>
          <Controller
            name="treatmentResponse"
            control={methods.control}
            render={({ field }) => (
              <FormControl fullWidth>
                <FormLabel>Mức độ đáp ứng điều trị</FormLabel>
                <RadioGroup {...field}>
                  <FormControlLabel value="kiem_soat_hoan_toan" control={<Radio />} label="Kiểm soát hoàn toàn (UCT=16, UAS7=0)" />
                  <FormControlLabel value="kiem_soat_tot"        control={<Radio />} label="Kiểm soát tốt, bệnh rất nhẹ (UCT 12–15, UAS7 1–6)" />
                  <FormControlLabel value="kiem_soat_kem_nhe"    control={<Radio />} label="Kiểm soát kém, bệnh nhẹ (UCT <12, UAS7 7–15)" />
                  <FormControlLabel value="kiem_soat_kem_tb"     control={<Radio />} label="Kiểm soát kém, bệnh trung bình (UCT <12, UAS7 16–27)" />
                  <FormControlLabel value="kiem_soat_kem_cao"    control={<Radio />} label="Kiểm soát kém, bệnh cao (UCT <12, UAS7 28–42)" />
                </RadioGroup>
              </FormControl>
            )}
          />
        </Grid>

        {/* ===== Tác dụng không mong muốn ===== */}
        <Grid item><FormLabel>Tác dụng không mong muốn (multichoice)</FormLabel></Grid>

        <Grid item>
          <FormControl fullWidth>
            <FormLabel>Toàn trạng</FormLabel>
            {renderMultiCheckbox('adverseEffects', [
              { value: 'met_moi', label: 'Mệt mỏi' },
            ])}
          </FormControl>
        </Grid>

        <Grid item>
          <FormControl fullWidth>
            <FormLabel>Thần kinh</FormLabel>
            {renderMultiCheckbox('adverseEffects', [
              { value: 'dau_dau', label: 'Đau đầu' },
              { value: 'chong_mat', label: 'Chóng mặt' },
              { value: 'buon_ngu', label: 'Buồn ngủ' },
              { value: 'ngu_ga', label: 'Ngủ gà' },
            ])}
          </FormControl>
        </Grid>

        <Grid item>
          <FormControl fullWidth>
            <FormLabel>Tiêu hóa</FormLabel>
            {renderMultiCheckbox('adverseEffects', [
              { value: 'chan_an', label: 'Chán ăn' },
              { value: 'kho_tieu', label: 'Khó tiêu' },
              { value: 'dau_bung', label: 'Đau bụng' },
            ])}
          </FormControl>
        </Grid>

        <Grid item>
          <FormControl fullWidth>
            <FormLabel>Tim mạch</FormLabel>
            {renderMultiCheckbox('adverseEffects', [
              { value: 'dau_nguc', label: 'Đau ngực' },
              { value: 'hoi_hop_trong_nguc', label: 'Hồi hộp, trống ngực' },
            ])}
          </FormControl>
        </Grid>

        <Grid item>
          <Field.Text name="adverseOther" label="Khác (ghi rõ)" {...fieldProps} />
        </Grid>

        {/* ===== Triệu chứng khám hiện tại ===== */}
        <Grid item>
          <Controller
            name="hasSanPhu"
            control={methods.control}
            render={({ field }) => (
              <FormControl fullWidth>
                <FormLabel>Sẩn phù</FormLabel>
                <RadioGroup {...field}>
                  <FormControlLabel value="co"    control={<Radio />} label="Có" />
                  <FormControlLabel value="khong" control={<Radio />} label="Không" />
                </RadioGroup>
              </FormControl>
            )}
          />
        </Grid>

        <Grid item>
          <Controller
            name="hasPhuMach"
            control={methods.control}
            render={({ field }) => (
              <FormControl fullWidth>
                <FormLabel>Phù mạch</FormLabel>
                <RadioGroup {...field}>
                  <FormControlLabel value="co"    control={<Radio />} label="Có" />
                  <FormControlLabel value="khong" control={<Radio />} label="Không" />
                </RadioGroup>
              </FormControl>
            )}
          />
        </Grid>

        <Grid item><Field.Text name="lesionLocation" label="Vị trí" {...fieldProps} /></Grid>
        <Grid item><Field.Text name="aas7" label="AAS7" {...fieldProps} /></Grid>
        <Grid item><Field.Text name="anaphylaxisSymptoms" label="Triệu chứng phản vệ" {...fieldProps} /></Grid>
        <Grid item><Field.Text name="newComorbids" label="Tiểu sử bệnh án khác (mới phát hiện)" {...fieldProps} /></Grid>

        {/* ===== KẾT QUẢ TEST ===== */}
        {/* Da vẽ nổi */}
        <Grid item><FormLabel>Da vẽ nổi</FormLabel></Grid>
        <Grid item>
          <Controller
            name="dermographismResult"
            control={methods.control}
            render={({ field }) => (
              <FormControl fullWidth>
                <RadioGroup {...field}>
                  <FormControlLabel value="duong_tinh" control={<Radio />} label="Dương tính" />
                  <FormControlLabel value="am_tinh"    control={<Radio />} label="Âm tính" />
                </RadioGroup>
              </FormControl>
            )}
          />
        </Grid>
        <Grid item><Field.Text name="fricScore" label="Fric score (điểm)" {...fieldProps} /></Grid>
        <Grid item><Field.Text name="nrsItch_dermo" label="Điểm ngứa NRS" {...fieldProps} /></Grid>
        <Grid item><Field.Text name="nrsPain_dermo" label="Điểm đau NRS" {...fieldProps} /></Grid>
        <Grid item><Field.Text name="nrsBurn_dermo" label="Điểm bỏng rát NRS" {...fieldProps} /></Grid>

        {/* Mày đay do lạnh (Temptest) */}
        <Grid item><FormLabel>Mày đay do lạnh (Temptest)</FormLabel></Grid>
        <Grid item>
          <Controller
            name="coldTemptestResult"
            control={methods.control}
            render={({ field }) => (
              <FormControl fullWidth>
                <RadioGroup {...field}>
                  <FormControlLabel value="duong_tinh" control={<Radio />} label="Dương tính" />
                  <FormControlLabel value="am_tinh"    control={<Radio />} label="Âm tính" />
                </RadioGroup>
              </FormControl>
            )}
          />
        </Grid>
        <Grid item><Field.Text name="coldPositiveTempC" label="Vùng nhiệt độ dương tính (°C)" {...fieldProps} /></Grid>
        <Grid item><Field.Text name="nrsItch_coldTemp" label="Điểm ngứa NRS" {...fieldProps} /></Grid>
        <Grid item><Field.Text name="nrsPain_coldTemp" label="Điểm đau NRS" {...fieldProps} /></Grid>
        <Grid item><Field.Text name="nrsBurn_coldTemp" label="Điểm bỏng rát NRS" {...fieldProps} /></Grid>

        {/* Test cục đá */}
        <Grid item><FormLabel>Mày đay do lạnh – Test cục đá</FormLabel></Grid>
        <Grid item>
          <Controller
            name="iceCubeResult"
            control={methods.control}
            render={({ field }) => (
              <FormControl fullWidth>
                <RadioGroup {...field}>
                  <FormControlLabel value="duong_tinh" control={<Radio />} label="Dương tính" />
                  <FormControlLabel value="am_tinh"    control={<Radio />} label="Âm tính" />
                </RadioGroup>
              </FormControl>
            )}
          />
        </Grid>
        <Grid item><Field.Text name="iceLatencyMin" label="Ngưỡng thời gian (phút)" {...fieldProps} /></Grid>
        <Grid item><Field.Text name="nrsItch_ice" label="Điểm ngứa NRS" {...fieldProps} /></Grid>
        <Grid item><Field.Text name="nrsPain_ice" label="Điểm đau NRS" {...fieldProps} /></Grid>
        <Grid item><Field.Text name="nrsBurn_ice" label="Điểm bỏng rát NRS" {...fieldProps} /></Grid>

        {/* Mày đay do choline (xe đạp lực kế) */}
        <Grid item><FormLabel>Mày đay do choline (Xe đạp lực kế)</FormLabel></Grid>
        <Grid item>
          <Controller
            name="cholinergicResult"
            control={methods.control}
            render={({ field }) => (
              <FormControl fullWidth>
                <RadioGroup {...field}>
                  <FormControlLabel value="duong_tinh" control={<Radio />} label="Dương tính" />
                  <FormControlLabel value="am_tinh"    control={<Radio />} label="Âm tính" />
                </RadioGroup>
              </FormControl>
            )}
          />
        </Grid>
        <Grid item><Field.Text name="cholinergicOnsetMin" label="Thời gian xuất hiện tổn thương (phút)" {...fieldProps} /></Grid>
        <Grid item><Field.Text name="nrsItch_cholin" label="Điểm ngứa NRS" {...fieldProps} /></Grid>
        <Grid item><Field.Text name="nrsPain_cholin" label="Điểm đau NRS" {...fieldProps} /></Grid>
        <Grid item><Field.Text name="nrsBurn_cholin" label="Điểm bỏng rát NRS" {...fieldProps} /></Grid>

        {/* CUSI & nguyên nhân khác */}
        <Grid item><Field.Text name="cusiScore" label="CUSI (điểm)" {...fieldProps} /></Grid>
        <Grid item><Field.Text name="otherEtiology" label="Căn nguyên khác (ghi rõ)" {...fieldProps} /></Grid>

        {/* UCT/ACT tổng kết (đã có ở trên; giữ để nhập nhanh ở cuối nếu muốn) */}
        {/* <Grid item><Field.Text name="uctScore" label="UCT (điểm)" {...fieldProps} /></Grid>
        <Grid item><Field.Text name="actScore" label="ACT (điểm)" {...fieldProps} /></Grid> */}

        {/* ===== Nút Lưu ===== */}
        <Grid item sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, padding: 7}}>
          <Button type="submit" variant="contained">Lưu</Button>
        </Grid>
      </Grid>
    </Form>
    </>
  );
}
