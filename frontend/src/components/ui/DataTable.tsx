import type { ReactNode } from 'react';
import './DataTable.css';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (item: T, index: number) => ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowKey: (item: T) => string | number;
}

export default function DataTable<T>({
  columns,
  data,
  getRowKey,
}: DataTableProps<T>) {
  return (
    <div className="data-table-container">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} data-column-key={column.key}>{column.header}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((item) => (
            <tr key={getRowKey(item)}>
              {columns.map((column) => (
                <td key={column.key} data-column-key={column.key}>
                  {column.render(item, data.indexOf(item))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
