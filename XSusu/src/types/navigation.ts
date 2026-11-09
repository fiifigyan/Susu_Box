export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  CreateGroup: undefined;
  /** `code` prefills the invite field, e.g. when opened from a share link. */
  JoinGroup: { code?: string } | undefined;
  GroupDetail: { groupId: string };
  InviteMembers: { groupId: string };
  Defaulters: { groupId: string };
  MakePayment: { groupId: string; amount: number; day: number };
  SetupAutoCharge: undefined;
  SecurityDeposit: { groupId: string };
  SurplusAllocation: { groupId: string };
};

export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  VerifyOTP: { email: string };
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Today: undefined;
  Groups: undefined;
  Schedule: undefined;
  Profile: undefined;
  Notifications: undefined;
};