export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  CreateGroup: undefined;
  GroupDetail: { groupId: string };
  InviteMembers: { groupId: string };
  Defaulters: { groupId: string };
  MakePayment: { groupId: string; amount: number; day: number };
  SetupAutoCharge: undefined;
  SecurityDeposit: { groupId: string };
};

export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  VerifyOTP: { email: string };
};

export type MainTabParamList = {
  Home: undefined;
  Today: undefined;
  Groups: undefined;
  Schedule: undefined;
  Profile: undefined;
};