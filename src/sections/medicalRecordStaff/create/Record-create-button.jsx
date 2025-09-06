// 'use client';

// import React from 'react';
// import Box from '@mui/material/Box';
// import Button from '@mui/material/Button';
// import Typography from '@mui/material/Typography';
// import Stack from '@mui/material/Stack';

// // ----------------------------------------------------------------------

// // Dữ liệu cho các nút, giúp code sạch sẽ và dễ bảo trì
// const templates = [
//   {
//     id: 16,
//     label: 'Bệnh án cấp tính',
//     color: '#FFDAB9', // PeachPuff
//   },
//   {
//     id: 17,
//     label: 'Bệnh án mãn tính lần 1',
//     color: '#FFFACD', // LemonChiffon
//   },
//   {
//     id: 18,
//     label: 'Bệnh án mãn tính tái khám',
//     color: '#98FB98', // PaleGreen
//   },
// ];

// export function RecordCreateButtons({ onTemplateSelect }) {
//   const buttonStyles = {
//     color: '#333',
//     fontWeight: 'bold',
//     textTransform: 'none',
//     padding: '20px 40px',
//     borderRadius: '16px',
//     boxShadow: 3,
//     transition: 'transform 0.2s, box-shadow 0.2s',
//     '&:hover': {
//       boxShadow: 6,
//       transform: 'scale(1.03)',
//     },
//   };

//   return (
//     <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
//       <Typography variant="h4" sx={{ mb: 4 }}>
//         Tạo bệnh án
//       </Typography>
//       <Stack direction="row" spacing={4} justifyContent="center">
//         {templates.map((template) => (
//           <Button
//             key={template.id}
//             variant="contained"
//             onClick={() => onTemplateSelect(template.id)}
//             sx={{
//               ...buttonStyles,
//               backgroundColor: template.color,
//               '&:hover': {
//                 ...buttonStyles['&:hover'],
//                 backgroundColor: template.color,
//               },
//             }}
//           >
//             {template.label}
//           </Button>
//         ))}
//       </Stack>
//     </Box>
//   );
// }