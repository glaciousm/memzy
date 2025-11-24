import React from 'react';
import { Chip } from '@mui/material';
import { Tag } from '@/types';

interface TagChipProps {
  tag: Tag;
  onDelete?: () => void;
  size?: 'small' | 'medium';
  clickable?: boolean;
  onClick?: () => void;
}

const TagChip: React.FC<TagChipProps> = ({
  tag,
  onDelete,
  size = 'small',
  clickable = false,
  onClick
}) => {
  return (
    <Chip
      label={tag.name}
      size={size}
      clickable={clickable}
      onClick={onClick}
      onDelete={onDelete}
      sx={{
        bgcolor: tag.colorCode || '#757575',
        color: '#fff',
        fontWeight: 500,
        '&:hover': {
          bgcolor: tag.colorCode ? `${tag.colorCode}dd` : '#616161',
        },
        '& .MuiChip-deleteIcon': {
          color: 'rgba(255, 255, 255, 0.7)',
          '&:hover': {
            color: 'rgba(255, 255, 255, 0.9)',
          },
        },
      }}
    />
  );
};

export default TagChip;
