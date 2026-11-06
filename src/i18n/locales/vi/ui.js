// The page markup (src/components/office), one group per component. The office's code fills most of it in later.
export default {
  meta: {
    title: 'My Office: văn phòng 3D cho các phiên Claude Code',
    description: 'Mỗi phiên Claude Code là một nhân vật ngồi bàn trong văn phòng 3D. Duyệt quyền, xem RAM và hạn mức gói, biết từng agent đang làm gì. Miễn phí, mã nguồn mở.',
  },
  topBar: {
    sampleData: 'dữ liệu giả lập',
    settings: 'Cài đặt',
    settingsTitle: 'Cài đặt: văn phòng, cảnh nền, nhân vật, thông báo, mở trên điện thoại',
    phone: 'Mở trên điện thoại',
    bell: 'Báo khi chờ duyệt',
    toggles: {
      sound: 'Âm thanh',
      perm: 'Duyệt quyền ngay trong văn phòng',
    },
  },
  macDrawer: {
    refresh: 'Đo lại',
  },
  // the tab bar and sheets on a phone (ui/phone.js)
  phone: {
    tabs: 'Các mục',
    sessions: 'Phiên',
    approve: 'Duyệt',
    approveEmpty: 'Không có gì chờ duyệt',
    approveEmptySub: 'Khi một phiên cần bạn cho phép, thẻ duyệt hiện ở đây và nổi ngay trên thanh dưới cùng.',
  },
  phoneModal: {
    title: 'Mở trên điện thoại',
  },
  sessionDrawer: {
    label: 'Chi tiết phiên',
    read: 'file đã đọc',
    edit: 'lần sửa',
    cmd: 'lệnh',
    time: 'việc hiện tại',
    ctx: 'ngữ cảnh',
    cost: 'giá API ≈',
    chat: 'Hội thoại',
    subs: 'Trợ lý',
    activity: 'Hoạt động',
  },
  stage: {
    lite: 'Các phiên dạng danh sách',
  },
};
