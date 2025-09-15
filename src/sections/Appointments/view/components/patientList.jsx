"use client";

import { Autocomplete, TextField } from "@mui/material";
import { useState } from "react";

export default function PatientSelector({ patients = [], onSelect }) {
  const [value, setValue] = useState("");

  return (
    <Autocomplete
      options={patients.map((p) => p.id.toString())} // danh sách mã bệnh nhân
      value={value}
      onChange={(event, newValue) => {
        setValue(newValue || "");
        if (onSelect) {
          onSelect(newValue); // trả ra ngoài khi chọn
        }
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Mã bệnh nhân"
          fullWidth
          type="number"
        />
      )}
      filterOptions={(options, state) =>
        options.filter((option) =>
          option.toLowerCase().includes(state.inputValue.toLowerCase())
        )
      }
      freeSolo
    />
  );
}
