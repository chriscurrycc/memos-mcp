export type Visibility = "PRIVATE" | "PROTECTED" | "PUBLIC";
export type RowStatus = "ACTIVE" | "ARCHIVED";
export type MemoRelationType = "REFERENCE" | "COMMENT";
export type ReviewSource =
  | "REVIEW_SOURCE_REVIEW"
  | "REVIEW_SOURCE_ON_THIS_DAY"
  | "REVIEW_SOURCE_SURPRISE"
  | "REVIEW_SOURCE_TIME_TRAVEL";

export interface Memo {
  name: string;
  uid: string;
  rowStatus: RowStatus;
  creator: string;
  createTime: string;
  updateTime: string;
  displayTime: string;
  content: string;
  visibility: Visibility;
  tags: string[];
  pinned: boolean;
  resources: Resource[];
  relations: MemoRelation[];
  reactions: Reaction[];
  property?: MemoProperty;
  parent?: string;
  snippet?: string;
  location?: Location;
}

export interface MemoProperty {
  hasLink: boolean;
  hasTaskList: boolean;
  hasCode: boolean;
  hasIncompleteTasks: boolean;
}

export interface Location {
  placeholder: string;
  latitude: number;
  longitude: number;
}

export interface Resource {
  name: string;
  uid: string;
  createTime: string;
  filename: string;
  externalLink: string;
  type: string;
  size: string;
  memo?: string;
}

export interface MemoRelationRef {
  name: string;
  uid?: string;
}

export interface MemoRelation {
  memo: string | MemoRelationRef;
  relatedMemo: string | MemoRelationRef;
  type: MemoRelationType;
}

export interface Reaction {
  id: number;
  creator: string;
  contentId: string;
  reactionType: string;
}

export interface Tag {
  id: number;
  createTime: string;
  updateTime: string;
  creator: string;
  tagHash: string;
  tagName: string;
  emoji: string;
  pinnedTime: string;
}

export interface ListResponse<T> {
  [key: string]: T[] | string | undefined;
  nextPageToken?: string;
}

export interface OnThisDayGroup {
  year: number;
  memos: Memo[];
}

export interface ReviewStats {
  totalMemos: number;
  reviewedLast30Days: number;
  availableForReview: number;
  totalSessions: number;
}
