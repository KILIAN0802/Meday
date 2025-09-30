import React from 'react';
import { RecordCreateButtons } from '../Record-create-button';
import { TableManager } from '../Record-create-tableManager';

export function RecordCreateView() {
  return (
    <>
      <RecordCreateButtons />
      <TableManager />
    </>
  );
}