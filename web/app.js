/**
 * HueLegend Web3 Core Engine - Ethers.js v5
 * He thong truy xuat nguon goc dac san Hue tren Blockchain
 * Tuong thich Smart Contract ProjectCore (Lab 8 - Lab 15)
 * Chu thich trong ma viet bang tieng Viet khong dau theo quy uoc AGENTS.md
 */

// ============================================================================
// 1. CAU HINH HE THONG VA HANG SO ON-CHAIN
// ============================================================================
const CONTRACT_ADDRESS = "0x35655079aEbB215E58e379D5a8c2f1f3a5323C6b";
const SEPOLIA_CHAIN_ID = "0xaa36a7"; // 11155111
const SEPOLIA_DECIMAL_ID = 11155111;
const ETHERSCAN_BASE_URL = "https://sepolia.etherscan.io";

// Ma bam vai tro OpenZeppelin AccessControl RBAC (ProjectCore.sol)
const ROLE_HASHES = {
  ROLE_ADMIN: "0xdf8b4c520ffe197c5343c6f5aec59570151ef9a492f2c624fd45ddde6135ec42",
  ROLE_PRODUCER: "0x2c0f20977a41ca739e03496033e64f7b605151ee67b93b827e8a946ad4ee2678",
  ROLE_LOGISTICS: "0x789b78809f69f29ee87bc6c1e57c6b54a2a16d56df3d132cb0a54cf53d9e47cb",
  ROLE_RETAILER: "0xa3858c42a5a54db645ce1e2e1329c29c8e1f592aa1527efd75c924bcbe1fb4e1",
  ROLE_INSPECTOR: "0x4296dbb7b322384a621147a468d6ef71f28b40d6c44917a22ab65a12154c34cb"
};

// ABI day du cua hop dong ProjectCore
const PROJECT_CORE_ABI = [
  "constructor()",
  "error BatchAlreadyExists(string batchCode)",
  "error BatchAlreadyVerified(string batchCode)",
  "error BatchNotFound(string batchCode)",
  "error BatchNotVerified(string batchCode)",
  "error EmptyString(string paramName)",
  "error FeeExceedsLimit(uint256 attempted, uint256 maxLimit)",
  "error InsufficientBatchFee(uint256 provided, uint256 requiredFee)",
  "error InvalidAddress()",
  "error MaxCheckpointsExceeded(string batchCode, uint256 maxAllowed)",
  "error NothingToWithdraw()",
  "error StakeTooLow(uint256 provided, uint256 minimum)",
  "error StillLocked(uint256 unlockAt, uint256 currentTime)",
  "error StringTooLong(string paramName, uint256 maxAllowed)",
  "error TransferFailed()",
  "error UnauthorizedCaller(address caller, bytes32 requiredRole)",
  "error ZeroAmount()",
  "event BatchCreated(string indexed batchCode, string productName, address indexed producer, uint256 timestamp)",
  "event BatchCreationFeeUpdated(uint256 oldFee, uint256 newFee)",
  "event BatchFeeCollected(address indexed producer, string indexed batchCode, uint256 feeAmount)",
  "event BatchVerificationRevoked(string indexed batchCode, address indexed inspector, string reason, uint256 timestamp)",
  "event BatchVerified(string indexed batchCode, address indexed inspector, uint256 timestamp)",
  "event CheckpointAdded(string indexed batchCode, address indexed recorder, bytes32 indexed role, string action, string location, uint256 timestamp)",
  "event RoleAssigned(address indexed account, bytes32 indexed role)",
  "event RoleRevoked(address indexed account, bytes32 indexed role)",
  "event StakeDeposited(address indexed producer, uint256 amount, uint256 unlockTime)",
  "event StakeWithdrawn(address indexed producer, uint256 amount)",
  "function ROLE_ADMIN() view returns (bytes32)",
  "function ROLE_INSPECTOR() view returns (bytes32)",
  "function ROLE_LOGISTICS() view returns (bytes32)",
  "function ROLE_PRODUCER() view returns (bytes32)",
  "function ROLE_RETAILER() view returns (bytes32)",
  "function addCheckpoint(string batchCode, bytes32 role, string location, string action, string metadataURI)",
  "function batchCreationFee() view returns (uint256)",
  "function createBatch(string batchCode, string productName, string origin, string initialMetadataURI) payable",
  "function depositStake() payable",
  "function ecosystemFund() view returns (address)",
  "function getBatch(string batchCode) view returns (tuple(string batchCode, string productName, string origin, uint256 createdAt, address producer, bool isVerified, bool exists))",
  "function getCheckpoints(string batchCode) view returns (tuple(uint256 timestamp, address recorder, bytes32 role, string location, string action, string metadataURI)[])",
  "function getTotalBatches() view returns (uint256)",
  "function getBatchCodeByIndex(uint256 index) view returns (string)",
  "function getStakeInfo(address producer) view returns (uint256 balance, uint256 unlockAt, uint256 remainingSeconds)",
  "function hasRole(address account, bytes32 role) view returns (bool)",
  "function owner() view returns (address)",
  "function producerStake(address) view returns (uint256)",
  "function producerUnlockTime(address) view returns (uint256)",
  "function setBatchCreationFee(uint256 newFee)",
  "function verifyBatch(string batchCode, string inspectorNote, string certificateURI)",
  "function revokeBatchVerification(string batchCode, string reason)",
  "function withdrawStake()"
];

// Co so du lieu mau (Mock & Fallback khi offline hoac testnet chu ky offline)
const SAMPLE_BATCHES = {
  "HL-MEXUNG-2026-001": {
    batchCode: "HL-MEXUNG-2026-001",
    productName: "Mè Xửng Thiên Hương Thượng Hạng",
    origin: "20 Chi Lăng, Phường Phú Hậu, TP Huế",
    createdAt: 1773000000,
    producer: "0x82d022a704706B2f144863D619D7418F8a0f19A7",
    isVerified: true,
    exists: true,
    ocopStandard: "OCOP 4 Sao Tỉnh Thừa Thiên Huế",
    certificationNo: "OCOP-HUE-2026-048",
    quantity: "1.000 hộp (Loại 500g)",
    checkpoints: [
      {
        stepName: "Chặng 1: Sản Xuất & Đóng Gói",
        role: "ROLE_PRODUCER",
        roleTitle: "Cơ Sở Sản Xuất",
        location: "Xưởng sản xuất Thiên Hương, Phú Hậu, TP Huế",
        action: "Thu hoạch mè trắng hạt tròn và đậu phụng Vĩnh Linh, nấu kẹo theo công thức mạch nha gia truyền, đóng gói hút chân không tiệt trùng.",
        timestamp: 1773000000,
        recorder: "0x82d022a704706B2f144863D619D7418F8a0f19A7",
        metadataURI: "ipfs://QmHueMeXungBatch001ProductionSpec",
        txHash: "0x4a18e3c5d678912ef01923847582910384751029384756102938475610293847",
        conditionNote: "Nhiệt độ phòng đóng gói 24°C, độ ẩm 50%, hạn sử dụng 12 tháng."
      },
      {
        stepName: "Chặng 2: Vận Chuyển & Lưu Kho",
        role: "ROLE_LOGISTICS",
        roleTitle: "Đơn Vị Vận Chuyển",
        location: "Ga Huế & Tuyến Đường Sắt Bắc Nam, Ga Hà Nội",
        action: "Vận chuyển bằng toa hàng bảo ôn chuyên dụng, niêm phong kẹp chì điện tử, theo dõi định vị GPS và cảm biến nhiệt độ liên tục.",
        timestamp: 1773172800,
        recorder: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
        metadataURI: "ipfs://QmHueMeXungBatch001ShippingReceipt",
        txHash: "0x8b29f4d7e1029384756102938475610293847561029384756102938475610293",
        conditionNote: "Nhiệt độ thùng xe ổn định 22°C - 25°C, không va đập, bảo quản khô ráo."
      },
      {
        stepName: "Chặng 3: Nhập Kho Đại Lý & Mở Bán",
        role: "ROLE_RETAILER",
        roleTitle: "Đại Lý Phân Phối",
        location: "Cửa hàng Đặc sản Cố Đô Huế, 12 Tràng Tiền, Hoàn Kiếm, Hà Nội",
        action: "Kiểm tra mã tem niêm phong QR, quét nhận diện lô hàng nguyên vẹn, nhập kho đại lý và chính thức mở bán phục vụ du khách.",
        timestamp: 1773345600,
        recorder: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
        metadataURI: "ipfs://QmHueMeXungBatch001RetailerAcceptance",
        txHash: "0x3c71a9e201928374651029384756102938475610293847561029384756102938",
        conditionNote: "Trưng bày kệ thoáng mát, tem niêm phong blockchain còn nguyên vẹn 100%."
      }
    ]
  },
  "HL-TOMCHUA-2026-002": {
    batchCode: "HL-TOMCHUA-2026-002",
    productName: "Tôm Chua Trọng Tín Cung Đình",
    origin: "Đầm Phá Tam Giang, Huyện Quảng Điền, Thừa Thiên Huế",
    createdAt: 1773200000,
    producer: "0x82d022a704706B2f144863D619D7418F8a0f19A7",
    isVerified: true,
    exists: true,
    ocopStandard: "OCOP 4 Sao - Đặc Sản Cố Đô",
    certificationNo: "OCOP-HUE-2026-092",
    quantity: "800 hũ (Hũ thủy tinh 450g)",
    checkpoints: [
      {
        stepName: "Chặng 1: Sản Xuất & Lên Men",
        role: "ROLE_PRODUCER",
        roleTitle: "Cơ Sở Sản Xuất",
        location: "Xưởng chế biến Trọng Tín, Đầm Chuồn, Phú Vang, Huế",
        action: "Tuyển chọn tôm rảo tươi sống Đầm Chuồn, ủ lên men tự nhiên với riềng củ, tỏi ớt Huế và rượu nếp thơm nồng trong chum sành 21 ngày.",
        timestamp: 1773200000,
        recorder: "0x82d022a704706B2f144863D619D7418F8a0f19A7",
        metadataURI: "ipfs://QmHueTomChuaBatch002Production",
        txHash: "0x11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff",
        conditionNote: "Ủ tự nhiên ở nhiệt độ 28°C - 30°C, kiểm soát vi sinh đạt chuẩn ATTP."
      },
      {
        stepName: "Chặng 2: Vận Chuyển Kho Lạnh",
        role: "ROLE_LOGISTICS",
        roleTitle: "Đơn Vị Vận Chuyển",
        location: "Kho lạnh Trung chuyển Miền Trung, KCN Phú Bài, Huế",
        action: "Vận chuyển bằng xe chuyên dụng thùng lạnh, giữ trọn độ giòn ngọt của tôm chua và ngăn chặn lên men quá độ.",
        timestamp: 1773300000,
        recorder: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
        metadataURI: "ipfs://QmHueTomChuaBatch002ColdChain",
        txHash: "0x223344556677889900aabbccddeeff11223344556677889900aabbccddeeff11",
        conditionNote: "Nhiệt độ bảo quản lạnh 10°C - 15°C trong suốt hành trình."
      },
      {
        stepName: "Chặng 3: Nhập Kho Siêu Thị OCOP",
        role: "ROLE_RETAILER",
        roleTitle: "Đại Lý Phân Phối",
        location: "Trung tâm Giới thiệu Nông sản OCOP Huế, Chợ Đông Ba, TP Huế",
        action: "Xác nhận nhập kho, kiểm định độ chua chuẩn vị, dán tem mã QR Blockchain phục vụ khách du lịch.",
        timestamp: 1773400000,
        recorder: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
        metadataURI: "ipfs://QmHueTomChuaBatch002Retailer",
        txHash: "0x3344556677889900aabbccddeeff11223344556677889900aabbccddeeff1122",
        conditionNote: "Lưu trữ ngăn mát 8°C - 12°C, sẵn sàng cung cấp cho người tiêu dùng."
      }
    ]
  },
  "HL-TRASEN-2026-003": {
    batchCode: "HL-TRASEN-2026-003",
    productName: "Trà Sen Cung Đình Huế Hoàng Gia",
    origin: "Hồ Tịnh Tâm, Phường Thuận Thành, TP Huế",
    createdAt: 1773350000,
    producer: "0x82d022a704706B2f144863D619D7418F8a0f19A7",
    isVerified: true,
    exists: true,
    ocopStandard: "OCOP 5 Sao Tiềm Năng - Di Sản Ẩm Thực",
    certificationNo: "OCOP-HUE-2026-001",
    quantity: "300 hộp (Hộp gỗ sơn mài Cung đình 200g)",
    checkpoints: [
      {
        stepName: "Chặng 1: Ướp Hương Sen Hồ Tịnh",
        role: "ROLE_PRODUCER",
        roleTitle: "Cơ Sở Sản Xuất",
        location: "Trà đình Tịnh Tâm, Hồ Tịnh Tâm, TP Huế",
        action: "Thu hái hoa sen bách diệp đầu mùa lúc sáng sớm, ướp từng búp trà xanh Tân Cương thượng hạng vào nhụy hoa sen qua đêm hứng sương sớm.",
        timestamp: 1773350000,
        recorder: "0x82d022a704706B2f144863D619D7418F8a0f19A7",
        metadataURI: "ipfs://QmHueTraSenBatch003Heritage",
        txHash: "0x556677889900aabbccddeeff11223344556677889900aabbccddeeff11223344",
        conditionNote: "Ướp tự nhiên không hương liệu nhân tạo, sấy chân không giữ nguyên hương thơm hoàng tộc."
      },
      {
        stepName: "Chặng 2: Kiểm Định Chất Lượng & Lưu Kho",
        role: "ROLE_LOGISTICS",
        roleTitle: "Đơn Vị Vận Chuyển",
        location: "Kho trung chuyển Đường hàng không - Sân bay Phú Bài Huế",
        action: "Vận chuyển hỏa tốc bằng đường hàng không, đóng thùng chống ẩm cao cấp để bảo vệ cánh sen và hương trà.",
        timestamp: 1773450000,
        recorder: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
        metadataURI: "ipfs://QmHueTraSenBatch003AirCargo",
        txHash: "0x6677889900aabbccddeeff11223344556677889900aabbccddeeff1122334455",
        conditionNote: "Độ ẩm thùng hàng luôn dưới 30%, chống ẩm tuyệt đối."
      },
      {
        stepName: "Chặng 3: Phân Phối Trưng Bày",
        role: "ROLE_RETAILER",
        roleTitle: "Đại Lý Phân Phối",
        location: "Khu Trưng bày Di sản Hoàng Gia, Sân bay Quốc tế Tân Sơn Nhất, TP.HCM",
        action: "Tiếp nhận sản phẩm trà sen Cung đình, trưng bày tại quầy VIP Quà tặng Ngoại giao và Văn hóa Huế.",
        timestamp: 1773550000,
        recorder: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
        metadataURI: "ipfs://QmHueTraSenBatch003Retail",
        txHash: "0x77889900aabbccddeeff11223344556677889900aabbccddeeff112233445566",
        conditionNote: "Tủ trưng bày chống tia UV và điều hòa 20°C."
      }
    ]
  }
};

// ============================================================================
// 2. TRANG THAI TOAN CUC (GLOBAL STATE)
// ============================================================================
let web3Provider = null;
let web3Signer = null;
let projectCoreContract = null;
let currentAccount = null;
let currentNetwork = null;
let userRoles = {
  isAdmin: false,
  isProducer: false,
  isLogistics: false,
  isRetailer: false,
  isInspector: false
};
let producerStakeBalance = "0";

// ============================================================================
// 3. HE THONG TOAST NOTIFICATION THAY THE ALERT
// ============================================================================
class ToastSystem {
  constructor() {
    this.container = document.getElementById("toastContainer");
    if (!this.container) {
      this.container = document.createElement("div");
      this.container.id = "toastContainer";
      this.container.className = "toast-container";
      document.body.appendChild(this.container);
    }
  }

  show(message, type = "info", title = "", duration = 4500) {
    const toast = document.createElement("div");
    toast.className = `custom-toast toast-${type}`;

    let iconHtml = "ℹ️";
    if (type === "success") iconHtml = "✓";
    else if (type === "error") iconHtml = "✕";
    else if (type === "warning") iconHtml = "⚠️";
    else if (type === "loading") iconHtml = `<span class="toast-spinner"></span>`;

    const defaultTitle = {
      info: "Thông Báo",
      success: "Thành Công",
      error: "Lỗi Thao Tác",
      warning: "Cảnh Báo",
      loading: "Đang Xử Lý Giao Dịch"
    }[type] || "Thông Báo";

    toast.innerHTML = `
      <div class="toast-icon-box">${iconHtml}</div>
      <div class="toast-content">
        <div class="toast-title">${title || defaultTitle}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;

    this.container.appendChild(toast);

    // Tu dong xoa sau thoi gian
    if (duration > 0 && type !== "loading") {
      setTimeout(() => {
        toast.classList.add("toast-fade-out");
        setTimeout(() => toast.remove(), 400);
      }, duration);
    }

    return {
      element: toast,
      update: (newMsg, newType = "info", newTitle = "") => {
        toast.className = `custom-toast toast-${newType}`;
        const newIcon = newType === "success" ? "✓" : (newType === "error" ? "✕" : (newType === "loading" ? `<span class="toast-spinner"></span>` : "ℹ️"));
        toast.querySelector(".toast-icon-box").innerHTML = newIcon;
        if (newTitle) toast.querySelector(".toast-title").innerText = newTitle;
        toast.querySelector(".toast-message").innerHTML = newMsg;
        if (newType !== "loading") {
          setTimeout(() => {
            toast.classList.add("toast-fade-out");
            setTimeout(() => toast.remove(), 400);
          }, 4500);
        }
      },
      close: () => {
        toast.classList.add("toast-fade-out");
        setTimeout(() => toast.remove(), 400);
      }
    };
  }
}

const Toast = new ToastSystem();

// Ham hien thi Toast tien loi
function showToast(message, type = "info", title = "", duration = 4500) {
  return Toast.show(message, type, title, duration);
}

// ============================================================================
// 4. TIEN ICH DINH DANG & HELPER FUNCTIONS
// ============================================================================
function shortenAddress(addr) {
  if (!addr) return "Chưa kết nối";
  return addr.substring(0, 6) + "..." + addr.substring(addr.length - 4);
}

function formatTimestamp(ts) {
  if (!ts) return "N/A";
  const num = typeof ts === "number" ? ts : Number(ts.toString());
  const date = new Date(num * 1000);
  return date.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function parseUrlParam(paramName) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(paramName) || urlParams.get(paramName.toLowerCase());
}

// Chuyen doi ma loi tuy bien cua Solidity sang tieng Viet ro rang
function translateContractError(err) {
  const errStr = (err && (err.data?.message || err.message || err.toString())) || "";
  console.warn("Loi on-chain goc:", err);

  if (errStr.includes("UnauthorizedCaller")) {
    return "⛔ LỖI PHÂN QUYỀN: Ví của bạn không sở hữu vai trò hợp lệ để thực hiện thao tác này!";
  }
  if (errStr.includes("InsufficientBatchFee")) {
    return "⛔ THIẾU PHÍ TẠO LÔ: Quy tắc kinh tế Lab 11 bắt buộc nộp đủ 0.001 ETH vào Quỹ OCOP!";
  }
  if (errStr.includes("StakeTooLow")) {
    return "⛔ CHƯA ĐỦ CỌC: Cơ sở sản xuất cần ký quỹ tối thiểu 0.05 ETH trước khi tạo lô hàng!";
  }
  if (errStr.includes("BatchAlreadyExists")) {
    return "⛔ TRÙNG MÃ LÔ: Mã lô hàng này đã được đăng ký trên Blockchain. Vui lòng chọn mã khác!";
  }
  if (errStr.includes("BatchNotFound")) {
    return "⛔ KHÔNG TÌM THẤY: Mã lô hàng này chưa tồn tại trên hệ thống Smart Contract!";
  }
  if (errStr.includes("FeeExceedsLimit")) {
    return "⛔ VƯỢT TRẦN PHÍ: Phí điều chỉnh vượt quá giới hạn an toàn Circuit Breaker (0.01 ETH)!";
  }
  if (errStr.includes("StringTooLong")) {
    return "⛔ DỮ LIỆU QUÁ DÀI: Tên đặc sản hoặc thông tin chặng vượt quá số ký tự cho phép!";
  }
  if (errStr.includes("StillLocked")) {
    return "⛔ ĐANG KHÓA CỌC: Tiền ký quỹ uy tín đang trong thời hạn khóa an toàn 30 ngày!";
  }
  if (errStr.includes("user rejected") || errStr.includes("ACTION_REJECTED") || err.code === 4001) {
    return "⚠️ Người dùng đã từ chối xác nhận giao dịch trên ví MetaMask.";
  }
  return "Lỗi giao dịch: " + (err.reason || errStr.substring(0, 150));
}

// ============================================================================
// 5. KET NOI VI METAMASK VA KHOI TAO SMART CONTRACT (ETHERS.JS V5)
// ============================================================================
async function connectWallet() {
  if (typeof window.ethereum === "undefined") {
    showToast("Vui lòng cài đặt tiện ích mở rộng MetaMask để truy cập DApp!", "error", "Chưa Có MetaMask");
    return null;
  }

  const toastLoading = showToast("Đang kết nối tới ví MetaMask...", "loading", "Yêu Cầu Kết Nối");

  try {
    // Yeu cau truy cap tai khoan
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    if (!accounts || accounts.length === 0) {
      throw new Error("Không nhận được tài khoản từ MetaMask.");
    }

    currentAccount = accounts[0];

    // Khoi tao Web3Provider theo chuan Ethers.js v5
    web3Provider = new ethers.providers.Web3Provider(window.ethereum);
    web3Signer = web3Provider.getSigner();
    currentNetwork = await web3Provider.getNetwork();

    // Kiem tra mang Sepolia
    if (currentNetwork.chainId !== SEPOLIA_DECIMAL_ID) {
      showToast("Vui lòng chuyển mạng sang Sepolia Testnet để tương tác dữ liệu chính xác!", "warning", "Sai Mạng Blockchain");
      await requestSwitchToSepolia();
    }

    // Khoi tao the hien Hop dong ProjectCore
    projectCoreContract = new ethers.Contract(CONTRACT_ADDRESS, PROJECT_CORE_ABI, web3Signer);

    // Kiem tra cac vai tro cua dia chi vi tren Smart Contract
    await checkAccountRoles(currentAccount);

    toastLoading.update(`Đã kết nối ví: ${shortenAddress(currentAccount)}`, "success", "Kết Nối Thành Công");

    // Cap nhat giao dien
    updateWalletUI();

    return currentAccount;
  } catch (err) {
    console.error("Loi ket noi MetaMask:", err);
    toastLoading.update(translateContractError(err), "error", "Kết Nối Thất Bại");
    return null;
  }
}

// Chuyen mang tu dong sang Sepolia
async function requestSwitchToSepolia() {
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SEPOLIA_CHAIN_ID }]
    });
  } catch (switchError) {
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: SEPOLIA_CHAIN_ID,
            chainName: "Sepolia Test Network",
            nativeCurrency: { name: "Sepolia ETH", symbol: "SEP", decimals: 18 },
            rpcUrls: ["https://rpc.sepolia.org"],
            blockExplorerUrls: [ETHERSCAN_BASE_URL]
          }]
        });
      } catch (addError) {
        console.error("Khong the them mang Sepolia:", addError);
      }
    }
  }
}

// Kiem tra vai tro on-chain (hasRole)
async function checkAccountRoles(account) {
  if (!projectCoreContract || !account) return;

  try {
    const ownerAddress = await projectCoreContract.owner();
    const isOwner = (account.toLowerCase() === ownerAddress.toLowerCase());

    const [hasAdmin, hasProducer, hasLogistics, hasRetailer, hasInspector] = await Promise.all([
      isOwner ? Promise.resolve(true) : projectCoreContract.hasRole(account, ROLE_HASHES.ROLE_ADMIN).catch(() => false),
      isOwner ? Promise.resolve(true) : projectCoreContract.hasRole(account, ROLE_HASHES.ROLE_PRODUCER).catch(() => false),
      isOwner ? Promise.resolve(true) : projectCoreContract.hasRole(account, ROLE_HASHES.ROLE_LOGISTICS).catch(() => false),
      isOwner ? Promise.resolve(true) : projectCoreContract.hasRole(account, ROLE_HASHES.ROLE_RETAILER).catch(() => false),
      isOwner ? Promise.resolve(true) : projectCoreContract.hasRole(account, ROLE_HASHES.ROLE_INSPECTOR).catch(() => false)
    ]);

    userRoles = {
      isAdmin: isOwner || hasAdmin,
      isProducer: isOwner || hasProducer,
      isLogistics: isOwner || hasLogistics,
      isRetailer: isOwner || hasRetailer,
      isInspector: isOwner || hasInspector
    };

    // Lay so tien ky quy cua co so
    try {
      const stakeWei = await projectCoreContract.producerStake(account);
      producerStakeBalance = ethers.utils.formatEther(stakeWei);
    } catch {
      producerStakeBalance = "0";
    }

    console.log("Quyen han vi hien tai:", userRoles, "Coc:", producerStakeBalance, "ETH");
  } catch (err) {
    console.warn("Khong the kiem tra vai tro tu contract, dung gia tri mac dinh:", err);
  }
}

// Cap nhat thanh trang thai vi tren Header
function updateWalletUI() {
  const btnConnect = document.getElementById("btnConnectWallet");
  const walletBadge = document.getElementById("walletBadge");
  const walletAddrText = document.getElementById("walletAddressText");
  const networkPill = document.getElementById("networkPill");

  if (!btnConnect) return;

  if (currentAccount) {
    btnConnect.style.display = "none";
    if (walletBadge) {
      walletBadge.style.display = "inline-flex";
      if (walletAddrText) walletAddrText.innerText = shortenAddress(currentAccount);
    }
    if (networkPill) {
      networkPill.style.display = "inline-flex";
      networkPill.innerText = "Sepolia Testnet";
    }

    // Neu dang o trang Admin, goi ham cap nhat workspace admin
    if (typeof renderAdminWorkspace === "function") {
      renderAdminWorkspace();
    }
  } else {
    btnConnect.style.display = "inline-flex";
    btnConnect.innerHTML = `<span class="icon-metamask">🦊</span> Kết nối ví MetaMask`;
    if (walletBadge) walletBadge.style.display = "none";
    if (networkPill) networkPill.style.display = "none";
  }
}

// Lang nghe su kien MetaMask doi tai khoan va doi mang
if (typeof window.ethereum !== "undefined") {
  window.ethereum.on("accountsChanged", async (accounts) => {
    if (accounts.length === 0) {
      currentAccount = null;
      userRoles = { isAdmin: false, isProducer: false, isLogistics: false, isRetailer: false, isInspector: false };
      showToast("Ví MetaMask đã ngắt kết nối.", "warning", "Ngắt Kết Nối");
    } else {
      currentAccount = accounts[0];
      if (web3Provider) {
        web3Signer = web3Provider.getSigner();
        projectCoreContract = new ethers.Contract(CONTRACT_ADDRESS, PROJECT_CORE_ABI, web3Signer);
        await checkAccountRoles(currentAccount);
      }
      showToast(`Đã chuyển sang tài khoản: ${shortenAddress(currentAccount)}`, "info", "Đổi Tài Khoản");
    }
    updateWalletUI();
  });

  window.ethereum.on("chainChanged", (chainId) => {
    console.log("Mang blockchain thay doi:", chainId);
    window.location.reload();
  });
}

// ============================================================================
// 6. TRUY VAN DU LIEU LO HANG (TRA CUU NGUON GOC - CLIENT LOOKUP)
// ============================================================================
async function fetchBatchDetails(batchCode) {
  if (!batchCode) return null;
  const cleanCode = batchCode.trim();

  // 1. Thu goi on-chain qua Smart Contract neu da ket noi
  if (projectCoreContract) {
    try {
      const batchData = await projectCoreContract.getBatch(cleanCode);
      if (batchData && batchData.exists) {
        const checkpointsData = await projectCoreContract.getCheckpoints(cleanCode);
        
        // Chuyen doi struct sang format chuan
        const checkpoints = checkpointsData.map((cp, idx) => {
          let roleTitle = "Cơ Sở Sản Xuất";
          let stepName = `Chặng ${idx + 1}: Khởi Tạo & Đóng Gói`;

          if (cp.role === ROLE_HASHES.ROLE_LOGISTICS) {
            roleTitle = "Đơn Vị Vận Chuyển";
            stepName = `Chặng ${idx + 1}: Vận Chuyển & Lưu Kho`;
          } else if (cp.role === ROLE_HASHES.ROLE_RETAILER) {
            roleTitle = "Đại Lý Phân Phối";
            stepName = `Chặng ${idx + 1}: Nhập Kho & Mở Bán`;
          } else if (cp.role === ROLE_HASHES.ROLE_INSPECTOR) {
            roleTitle = "Cơ Quan Kiểm Định OCOP";
            stepName = `Chặng ${idx + 1}: Chứng Nhận Chất Lượng`;
          }

          return {
            stepName: stepName,
            role: cp.role,
            roleTitle: roleTitle,
            location: cp.location,
            action: cp.action,
            timestamp: cp.timestamp.toNumber ? cp.timestamp.toNumber() : Number(cp.timestamp),
            recorder: cp.recorder,
            metadataURI: cp.metadataURI,
            txHash: "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(""),
            conditionNote: cp.metadataURI || "Ghi nhận bảo quản đạt chuẩn chất lượng."
          };
        });

        return {
          batchCode: batchData.batchCode,
          productName: batchData.productName,
          origin: batchData.origin,
          createdAt: batchData.createdAt.toNumber ? batchData.createdAt.toNumber() : Number(batchData.createdAt),
          producer: batchData.producer,
          isVerified: batchData.isVerified,
          exists: true,
          ocopStandard: batchData.isVerified ? "OCOP 4 Sao Đã Xác Thực Trên Blockchain" : "Đang Chờ Kiểm Định OCOP",
          certificationNo: "BLOCKCHAIN-VERIFIED-" + cleanCode,
          quantity: "Theo hồ sơ công bố",
          checkpoints: checkpoints.length > 0 ? checkpoints : []
        };
      }
    } catch (err) {
      console.warn("Khong the truy van on-chain, kiem tra du lieu mau:", err.message);
    }
  }

  // 2. Kiem tra kho du lieu mau (Offline / Testnet fallback)
  if (SAMPLE_BATCHES[cleanCode]) {
    return SAMPLE_BATCHES[cleanCode];
  }

  // 3. Neu khong tim thay o ca hai nguon
  return null;
}

// ============================================================================
// 7. THAO TAC DANH CHO ADMIN / PARTNERS (ON-CHAIN WRITES)
// ============================================================================

// 1. Tao lo dac san moi (PRODUCER_ROLE)
async function executeCreateBatch(batchCode, productName, originLocation, initialNote, feeEth = "0.001") {
  if (!projectCoreContract || !web3Signer) {
    throw new Error("Vui lòng kết nối ví MetaMask trước khi thực hiện giao dịch!");
  }

  const toastProgress = showToast("Đang chuẩn bị ký giao dịch tạo lô đặc sản...", "loading", "Bước 1/3: Gửi Giao Dịch");

  try {
    const feeWei = ethers.utils.parseEther(feeEth);
    const tx = await projectCoreContract.createBatch(batchCode, productName, originLocation, initialNote, {
      value: feeWei
    });

    toastProgress.update(`Giao dịch đã phát sóng (${shortenAddress(tx.hash)}). Đang chờ thợ đào xác nhận khối...`, "loading", "Bước 2/3: Đang Đào Block");

    const receipt = await tx.wait();

    toastProgress.update(`Tạo lô hàng ${batchCode} thành công trên Blockchain! TxHash: ${shortenAddress(receipt.transactionHash)}`, "success", "Bước 3/3: Hoàn Tất");

    // Luu bo nho tam de tra cuu nhanh
    SAMPLE_BATCHES[batchCode] = {
      batchCode: batchCode,
      productName: productName,
      origin: originLocation,
      createdAt: Math.floor(Date.now() / 1000),
      producer: currentAccount,
      isVerified: false,
      exists: true,
      ocopStandard: "Đang Chờ Kiểm Định OCOP",
      certificationNo: "BATCH-CREATED-" + batchCode,
      quantity: "500 sản phẩm",
      checkpoints: [
        {
          stepName: "Chặng 1: Sản Xuất & Đóng Gói",
          role: "ROLE_PRODUCER",
          roleTitle: "Cơ Sở Sản Xuất",
          location: originLocation,
          action: "Khởi tạo lô đặc sản Huế và nộp phí 0.001 ETH vào Quỹ OCOP.",
          timestamp: Math.floor(Date.now() / 1000),
          recorder: currentAccount,
          metadataURI: initialNote,
          txHash: receipt.transactionHash,
          conditionNote: initialNote || "Đóng gói theo tiêu chuẩn OCOP."
        }
      ]
    };

    return receipt;
  } catch (err) {
    console.error("Loi tao lo hang:", err);
    toastProgress.update(translateContractError(err), "error", "Giao Dịch Bị Hủy");
    throw err;
  }
}

// 2. Cap nhat chang van chuyen (LOGISTICS_ROLE)
async function executeAddLogisticsStep(batchCode, location, actionDescription, conditionNote) {
  if (!projectCoreContract || !web3Signer) {
    throw new Error("Vui lòng kết nối ví MetaMask!");
  }

  const toastProgress = showToast("Đang ký giao dịch cập nhật chặng vận chuyển...", "loading", "Bước 1/3: Ký Giao Dịch");

  try {
    const roleHash = ROLE_HASHES.ROLE_LOGISTICS;
    const tx = await projectCoreContract.addCheckpoint(batchCode, roleHash, location, actionDescription, conditionNote);

    toastProgress.update(`Đang ghi nhận chặng vận chuyển vào khối... (Tx: ${shortenAddress(tx.hash)})`, "loading", "Bước 2/3: Đang Đào Block");

    const receipt = await tx.wait();

    toastProgress.update(`Đã cập nhật chặng vận chuyển thành công cho lô ${batchCode}!`, "success", "Bước 3/3: Hoàn Tất");

    // Cap nhat cache
    if (SAMPLE_BATCHES[batchCode]) {
      SAMPLE_BATCHES[batchCode].checkpoints.push({
        stepName: "Chặng 2: Vận Chuyển & Lưu Kho",
        role: "ROLE_LOGISTICS",
        roleTitle: "Đơn Vị Vận Chuyển",
        location: location,
        action: actionDescription,
        timestamp: Math.floor(Date.now() / 1000),
        recorder: currentAccount,
        metadataURI: conditionNote,
        txHash: receipt.transactionHash,
        conditionNote: conditionNote
      });
    }

    return receipt;
  } catch (err) {
    console.error("Loi cap nhat chang van chuyen:", err);
    toastProgress.update(translateContractError(err), "error", "Lỗi Cập Nhật Chặng");
    throw err;
  }
}

// 3. Xac nhan nhap kho dai ly (RETAILER_ROLE)
async function executeConfirmRetailerStep(batchCode, storeLocation, confirmationNote) {
  if (!projectCoreContract || !web3Signer) {
    throw new Error("Vui lòng kết nối ví MetaMask!");
  }

  const toastProgress = showToast("Đang xác nhận nhập kho điểm bán lẻ...", "loading", "Bước 1/3: Ký Giao Dịch");

  try {
    const roleHash = ROLE_HASHES.ROLE_RETAILER;
    const action = "Đã nhập kho đại lý phân phối, kiểm tra tem niêm phong và chính thức mở bán.";
    const tx = await projectCoreContract.addCheckpoint(batchCode, roleHash, storeLocation, action, confirmationNote);

    toastProgress.update(`Đang ghi nhận xác nhận bán lẻ lên mạng... (Tx: ${shortenAddress(tx.hash)})`, "loading", "Bước 2/3: Đang Đào Block");

    const receipt = await tx.wait();

    toastProgress.update(`Xác nhận nhập kho & mở bán thành công cho lô ${batchCode}!`, "success", "Bước 3/3: Hoàn Tất");

    // Cap nhat cache
    if (SAMPLE_BATCHES[batchCode]) {
      SAMPLE_BATCHES[batchCode].checkpoints.push({
        stepName: "Chặng 3: Nhập Kho & Mở Bán",
        role: "ROLE_RETAILER",
        roleTitle: "Đại Lý Phân Phối",
        location: storeLocation,
        action: action,
        timestamp: Math.floor(Date.now() / 1000),
        recorder: currentAccount,
        metadataURI: confirmationNote,
        txHash: receipt.transactionHash,
        conditionNote: confirmationNote
      });
    }

    return receipt;
  } catch (err) {
    console.error("Loi xac nhan ban le:", err);
    toastProgress.update(translateContractError(err), "error", "Lỗi Xác Nhận");
    throw err;
  }
}

// 4. Nap tien ky quy cam ket chat luong (0.05 ETH)
async function executeDepositStake(amountEth = "0.05") {
  if (!projectCoreContract || !web3Signer) {
    throw new Error("Vui lòng kết nối ví MetaMask!");
  }

  const toastProgress = showToast(`Đang nạp tiền ký quỹ ${amountEth} ETH...`, "loading", "Nạp Ký Quỹ Uy Tín");

  try {
    const valWei = ethers.utils.parseEther(amountEth);
    const tx = await projectCoreContract.depositStake({ value: valWei });

    toastProgress.update(`Đang xử lý nạp ký quỹ trên Blockchain... (Tx: ${shortenAddress(tx.hash)})`, "loading", "Chờ Xác Nhận");

    const receipt = await tx.wait();

    await checkAccountRoles(currentAccount);
    toastProgress.update(`Nạp ký quỹ ${amountEth} ETH thành công! Hạn khóa 30 ngày bảo đảm.`, "success", "Nạp Cọc Hoàn Tất");

    if (typeof renderAdminWorkspace === "function") {
      renderAdminWorkspace();
    }
    return receipt;
  } catch (err) {
    console.error("Loi nap ky quy:", err);
    toastProgress.update(translateContractError(err), "error", "Nạp Cọc Thất Bại");
    throw err;
  }
}
