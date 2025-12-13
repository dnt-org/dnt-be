import React from 'react';

const LogTable = ({ logs = [] }) => {
  const rows = logs.data || logs;
  return (
    <table className="log-table">
      <thead>
        <tr>
          <th>Time</th>
          <th>Level</th>
          <th>Message</th>
          <th>Context</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const attrs = row.attributes || row;
          const level = attrs.level;
          const timestamp = attrs.timestamp;
          const message = attrs.message;
          const context = attrs.context;
          return (
            <tr className="log-row" key={row.id}>
              <td className="timestamp">{new Date(timestamp).toLocaleString()}</td>
              <td className="level">
                <span className={`level-badge ${level}`}>{level}</span>
              </td>
              <td className="message">{message}</td>
              <td className="context">
                {(() => {
                  let full = '';
                  try {
                    full = JSON.stringify(context, null, 2);
                  } catch (_) {
                    full = String(context);
                  }
                  const preview = full.replace(/\s+/g, ' ').trim();
                  const short = preview.length > 120 ? `${preview.slice(0, 120)}…` : preview;
                  return (
                    <details className="context-details">
                      <summary>
                        <span className="context-preview">{short || '(empty)'}</span>
                      </summary>
                      <pre className="context-block">{full}</pre>
                    </details>
                  );
                })()}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default LogTable;