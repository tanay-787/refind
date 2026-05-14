export type ScreenshotAsset = {
  id: string;
  uri: string;
  filename: string;
  creationTime: number;
  width: number;
  height: number;
};

export type TimeFilterKey = 'all' | 'today' | 'week' | 'month';
