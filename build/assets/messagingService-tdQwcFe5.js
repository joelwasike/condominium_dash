import{c as t,a as e,b as n}from"./index-kOsm-8YM.js";/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const i=[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"m9 15 2 2 4-4",key:"1grp1n"}]],c=t("file-check",i),g={sendMessage:async a=>{const s=n("/api/messaging/messages");return await e(s,{method:"POST",body:JSON.stringify(a)})},getConversations:async()=>{const a=n("/api/messaging/messages/conversations");return await e(a)},getConversation:async a=>{const s=n(`/api/messaging/messages/${a}`);return await e(s)},markMessagesAsRead:async a=>{const s=n(`/api/messaging/messages/${a}/read`);return await e(s,{method:"POST"})},getInbox:async()=>{const a=n("/api/messaging/messages/inbox");return await e(a)},getUsers:async(a={})=>{let s=n("/api/messaging/users");const r=new URLSearchParams;return a.role&&r.append("role",a.role),a.search&&r.append("search",a.search),r.toString()&&(s+=`?${r.toString()}`),await e(s)}};export{c as F,g as m};
//# sourceMappingURL=messagingService-tdQwcFe5.js.map
