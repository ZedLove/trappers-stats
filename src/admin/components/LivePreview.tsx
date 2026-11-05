import { Box, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import type { PlayerLine } from '../../shared/schema';
import { deriveStats, formatRate, sumLines } from '../../shared/stats';

export interface LivePreviewProps {
  lines: PlayerLine[];
}

export default function LivePreview({ lines }: LivePreviewProps) {
  const stats = deriveStats(sumLines(lines));

  const rows: Array<[string, string | number]> = [
    ['G', stats.g],
    ['PA', stats.pa],
    ['AB', stats.ab],
    ['R', stats.r],
    ['H', stats.h],
    ['1B', stats.singles],
    ['2B', stats.doubles],
    ['3B', stats.triples],
    ['HR', stats.hr],
    ['BB', stats.bb],
    ['SF', stats.sf],
    ['K', stats.k],
    ['AVG', formatRate(stats.avg)],
    ['OBP', formatRate(stats.obp)],
    ['SLG', formatRate(stats.slg)],
    ['OPS', formatRate(stats.ops)],
  ];

  return (
    <Box>
      <Typography variant="h6" component="h2">
        Live preview
      </Typography>
      <Table size="small" aria-label="Live box score" sx={{ maxWidth: 280 }}>
        <TableHead>
          <TableRow>
            <TableCell>Stat</TableCell>
            <TableCell>Value</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(([label, value]) => (
            <TableRow key={label}>
              <TableCell>{label}</TableCell>
              <TableCell>{value}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
