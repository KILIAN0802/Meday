/**
 * Trích xuất giá trị cuối cùng từ một cấu trúc dữ liệu phức tạp để hiển thị.
 * @param {*} data Dữ liệu đầu vào (có thể là object, array, string, number).
 * @returns {string} Một chuỗi đại diện cho dữ liệu.
 */
export function extractFinalValue(data) {
  if (data === null || typeof data === 'undefined') {
    return '';
  }
  if (typeof data !== 'object' || data === null) {
    return String(data);
  }
  if (Array.isArray(data)) {
    return data.map(extractFinalValue).join(', ');
  }
  const values = Object.values(data);
  const extracted = values.map(extractFinalValue).filter(Boolean);
  return extracted.join('; ');
}

/**
 * Tìm tất cả các URL hình ảnh trong một cấu trúc dữ liệu.
 * @param {*} data Dữ liệu đầu vào để tìm kiếm.
 * @returns {string[]} Một mảng các URL hình ảnh.
 */
export function findImageUrls(data) {
  let urls = [];
  if (typeof data === 'string' && data.startsWith('http')) {
    return [data];
  }
  if (Array.isArray(data)) {
    for (const item of data) {
      urls = urls.concat(findImageUrls(item));
    }
  } else if (typeof data === 'object' && data !== null) {
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        urls = urls.concat(findImageUrls(data[key]));
      }
    }
  }
  return urls;
}