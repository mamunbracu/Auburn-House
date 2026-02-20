import { MemberName, Member, BillItem, RentEvent, BillMemberFinance } from './types';

export const HOUSE_NAME = "37 Normanby Road, Auburn 2144";
export const TOTAL_FORTNIGHTLY_RENT = 3000;

export const MEMBERS: Member[] = [
  { id: '4', name: 'Mamun', avatar: 'https://scontent.fsyd3-2.fna.fbcdn.net/v/t39.30808-6/615206061_4248602195389882_1960764178199710165_n.jpg?_nc_cat=108&ccb=1-7&_nc_sid=1d70fc&_nc_ohc=vQkvLEmdPNUQ7kNvwGu1F2v&_nc_oc=AdmH9ntfuprHMEIz6z4Jj8Ey0PWuhY2Ee2DP0qyjgXQKg5YtsHLx65t_eOnACWULFAzV_lxJDg5RJ9y-uFJMdEx0&_nc_zt=23&_nc_ht=scontent.fsyd3-2.fna&_nc_gid=qQAPWxm4b8gUFtPZuQj8Eg&oh=00_Afsvc-C9PK1ZAVuADQLsjbTxJiG7KW58_SuC55DJ3_ZN3A&oe=699B5DDD', phone: '0444 333 444', email: 'mamun@househub.local', dob: '1991-03-30', initialAdvance: 510, rentShare: 510 },
  { id: '5', name: 'Aara', avatar: 'https://raw.githubusercontent.com/mamunbracu/ph-news-portal-starter-pack-NextJs_2nd_Module_Resource/refs/heads/main/aara.jpeg', phone: '0455 555 666', email: 'aarati@househub.local', dob: '1995-12-12', initialAdvance: 0, rentShare: 0 },
  { id: '1', name: 'Dipanker', avatar: 'https://scontent.fsyd3-2.fna.fbcdn.net/v/t39.30808-6/600346531_25326749207005215_2889669373301743310_n.jpg?_nc_cat=110&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=cl0Ha7krIhIQ7kNvwFlhGVJ&_nc_oc=AdmzT5GhyPXBhU56w569deOoTgJZOoAU1XUnIXerNpe2WW7hyrT9s8HcKywjMUskAAiSbAXAgSEgUzYsJGj0dYQC&_nc_zt=23&_nc_ht=scontent.fsyd3-2.fna&_nc_gid=HUOJtoY3kLKvbQmF-OQvqA&oh=00_AfvKzOkbmiucA60jqPcUoaMw6WKH0_itpk8ptS8Ov3LOfg&oe=699A0D85', phone: '0412 345 678', email: 'dipanker@househub.local', dob: '1992-05-15', initialAdvance: 410, rentShare: 410 },
  { id: '3', name: 'Sudip', avatar: 'https://scontent.fsyd3-2.fna.fbcdn.net/v/t39.30808-6/545613381_4085152295030144_2267473966209946566_n.jpg?_nc_cat=108&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=G2hLT2T4W2AQ7kNvwHFqGZq&_nc_oc=AdmlPwY42pefUdrucGHydzK2vpCN2CAEQK8Cf_mVuIRv-JpANNzDW-XnjLocrwLMviYAkadaKse_D1Jow7BhWV6b&_nc_zt=23&_nc_ht=scontent.fsyd3-2.fna&_nc_gid=rMnc6o_0bJzboOtJpMln5w&oh=00_AfuA9MqyogfybVLfaw4OyUgoqj1_8kZZTIutpNeJw3yxfQ&oe=699A2491', phone: '0433 111 222', email: 'sudip@househub.local', dob: '1993-08-10', initialAdvance: 440, rentShare: 460 },
  { id: '2', name: 'Akash', avatar: 'https://scontent.fsyd3-1.fna.fbcdn.net/v/t39.30808-6/590629677_5159083107649450_6607275452023911003_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=107&ccb=1-7&_nc_sid=1d70fc&_nc_ohc=_3oDJIUliu0Q7kNvwHS_EoL&_nc_oc=AdnBCUcxTeVWVlWHWu4-d81JvO4alLl89Bgc8orcs9A7r3ipABo8vuU4DatRKh_e49_-hzlenikW3ZjYgwYmxNW-&_nc_zt=23&_nc_ht=scontent.fsyd3-1.fna&_nc_gid=fiUfFexV7IG0S2xXVzxRyQ&oh=00_Afs8Quum6DdSQebPxtTifNURwcIkeHk9wbR7xXbYQ8dYLg&oe=699B5D28', phone: '0422 987 654', email: 'akash@househub.local', dob: '1994-11-22', initialAdvance: 440, rentShare: 440 },
  { id: '6', name: 'Joya', avatar: 'https://raw.githubusercontent.com/mamunbracu/ph-news-portal-starter-pack-NextJs_2nd_Module_Resource/refs/heads/main/joya.jpeg', phone: '0466 777 888', email: 'joya@househub.local', dob: '1996-01-25', initialAdvance: 400, rentShare: 400 },
  { id: '7', name: 'Fayaz', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fayaz', phone: '0477 888 999', email: 'fayez@househub.local', dob: '1992-07-07', initialAdvance: 400, rentShare: 400 },
  { id: '8', name: 'Farid', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Farid', phone: '0488 999 000', email: 'farid@househub.local', dob: '1994-09-09', initialAdvance: 380, rentShare: 380 },
];

export const MEMBER_ORDER: MemberName[] = MEMBERS.map(m => m.name);

export const getDefaultStatus = () => {
  const status: any = {};
  MEMBER_ORDER.forEach(name => status[name] = false);
  return status as Record<MemberName, boolean>;
};

export const getDefaultBillFinances = (): Record<MemberName, BillMemberFinance> => {
  const finances: any = {};
  MEMBER_ORDER.forEach(name => {
    finances[name] = { paid: false, given: 0, due: 0 };
  });
  return finances;
};

export const INITIAL_BILLS: BillItem[] = [];

export const generateInitialRent = (): RentEvent[] => {
  const events: RentEvent[] = [];
  let current = new Date(2026, 1, 15); 
  while (current.getDay() !== 0) current.setDate(current.getDate() + 1); 
  const end = new Date(2026, 3, 30); 
  while (current <= end) {
    events.push({
      id: `rent-${current.getTime()}`,
      date: current.toISOString().split('T')[0],
      amount: TOTAL_FORTNIGHTLY_RENT,
      memberStatuses: getDefaultStatus()
    });
    current.setDate(current.getDate() + 14);
  }
  return events;
};