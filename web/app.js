/**
 * HueLegend Web3 Core Engine - Ethers.js v5
 * He thong truy xuat nguon goc dac san Hue tren Blockchain (Sepolia Testnet)
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

// ============================================================================
// 2. KHO DU LIEU MAU CHUAN CHO 6 DAC SAN HUE (DEMO MOCK)
// ============================================================================
const DEFAULT_SAMPLE_BATCHES = {
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
    currentStage: "Đại lý mở bán",
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
    currentStage: "Đại lý mở bán",
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
    currentStage: "Trưng bày VIP",
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
  },
  "HL-NONLA-2026-004": {
    batchCode: "HL-NONLA-2026-004",
    productName: "Nón Lá Bài Thơ Làng Tây Hồ",
    origin: "Làng Nón Tây Hồ, Xã Phú Hồ, Huyện Phú Vang, Thừa Thiên Huế",
    createdAt: 1773400000,
    producer: "0x82d022a704706B2f144863D619D7418F8a0f19A7",
    isVerified: false,
    exists: true,
    ocopStandard: "Đang Chờ Kiểm Định OCOP",
    certificationNo: "HUE-CRAFT-2026-015",
    quantity: "500 chiếc (Nón bài thơ 16 vành)",
    currentStage: "Tại xưởng làng nghề",
    checkpoints: [
      {
        stepName: "Chặng 1: Chuốt Vành & Chằm Nón",
        role: "ROLE_PRODUCER",
        roleTitle: "Cơ Sở Sản Xuất",
        location: "Hợp tác xã Nón lá Tây Hồ, Phú Vang, Huế",
        action: "Chọn lá nón non sấy khô trắng muốt, chuốt 16 vành tre cật tròn đều, lồng tranh phong cảnh Cầu Trường Tiền và thơ xứ Huế giữa 2 lớp lá.",
        timestamp: 1773400000,
        recorder: "0x82d022a704706B2f144863D619D7418F8a0f19A7",
        metadataURI: "ipfs://QmHueNonLaBatch004Heritage",
        txHash: "0x889900aabbccddeeff11223344556677889900aabbccddeeff11223344556677",
        conditionNote: "Đường kim mũi chỉ thanh mảnh, soi đèn hiện rõ hình ảnh phong cảnh Huế."
      }
    ]
  },
  "HL-TRAMGIO-2026-005": {
    batchCode: "HL-TRAMGIO-2026-005",
    productName: "Tinh Dầu Tràm Cung Đình Hoa Nén",
    origin: "Làng Nghề Nấu Dầu Tràm Lộc Thuỷ, Huyện Phú Lộc, Thừa Thiên Huế",
    createdAt: 1773450000,
    producer: "0x82d022a704706B2f144863D619D7418F8a0f19A7",
    isVerified: false,
    exists: true,
    ocopStandard: "Đang Chờ Kiểm Định OCOP",
    certificationNo: "HUE-ESSENTIAL-2026-033",
    quantity: "1.200 chai (Chai thủy tinh 50ml)",
    currentStage: "Vận chuyển lưu kho",
    checkpoints: [
      {
        stepName: "Chặng 1: Chưng Cất Tinh Dầu Tràm",
        role: "ROLE_PRODUCER",
        roleTitle: "Cơ Sở Sản Xuất",
        location: "Xưởng chưng cất Hoa Nén, Lộc Thủy, Phú Lộc, Huế",
        action: "Thu hái lá tràm gió tự nhiên chân đèo Hải Vân, chưng cất lôi cuốn hơi nước truyền thống bằng nồi đồng trong 6 giờ liên tục.",
        timestamp: 1773450000,
        recorder: "0x82d022a704706B2f144863D619D7418F8a0f19A7",
        metadataURI: "ipfs://QmHueTramGioBatch005Extraction",
        txHash: "0x9900aabbccddeeff11223344556677889900aabbccddeeff1122334455667788",
        conditionNote: "Hàm lượng Cineol đạt trên 60%, mùi thơm dịu nhẹ ấm áp, an toàn cho trẻ sơ sinh."
      },
      {
        stepName: "Chặng 2: Vận Chuyển Đóng Kiện",
        role: "ROLE_LOGISTICS",
        roleTitle: "Đơn Vị Vận Chuyển",
        location: "Bưu chính Quốc tế Huế - Trung tâm khai thác miền Trung",
        action: "Đóng gói màng xốp chống va đập, bảo quản tránh ánh sáng trực tiếp, chuẩn bị phân phối đến các đại lý toàn quốc.",
        timestamp: 1773500000,
        recorder: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
        metadataURI: "ipfs://QmHueTramGioBatch005Shipping",
        txHash: "0xaabbccddeeff11223344556677889900aabbccddeeff11223344556677889900",
        conditionNote: "Chống xóc nhiệt, thùng kín chống bay hơi tinh dầu."
      }
    ]
  },
  "HL-KEOGUONG-2026-006": {
    batchCode: "HL-KEOGUONG-2026-006",
    productName: "Kẹo Gương Đậu Phụng Phò Trạch",
    origin: "Làng Nghề Phò Trạch, Huyện Phong Điền, Thừa Thiên Huế",
    createdAt: 1773520000,
    producer: "0x82d022a704706B2f144863D619D7418F8a0f19A7",
    isVerified: false,
    exists: true,
    ocopStandard: "Đang Chờ Kiểm Định OCOP",
    certificationNo: "HUE-CANDY-2026-056",
    quantity: "600 hộp (Loại 300g)",
    currentStage: "Tại xưởng sản xuất",
    checkpoints: [
      {
        stepName: "Chặng 1: Thắng Đường & Cán Mỏng",
        role: "ROLE_PRODUCER",
        roleTitle: "Cơ Sở Sản Xuất",
        location: "Cơ sở kẹo gương Phò Trạch, Phong Điền, Huế",
        action: "Thắng đường cát trắng và mạch nha trong veo như thủy tinh, rải đều đậu phụng rang giòn và mè trắng, cán mỏng như tấm gương soi.",
        timestamp: 1773520000,
        recorder: "0x82d022a704706B2f144863D619D7418F8a0f19A7",
        metadataURI: "ipfs://QmHueKeoGuongBatch006Production",
        txHash: "0xbbccddeeff11223344556677889900aabbccddeeff11223344556677889900aa",
        conditionNote: "Đóng gói kín chống ẩm, giữ độ giòn tan ngọt thanh."
      }
    ]
  }
};

// Kho du lieu hoat dong trong bo nho (ho tro luu LocalStorage de demo muot ma)
let SAMPLE_BATCHES = JSON.parse(localStorage.getItem("HueLegend_Batches")) || JSON.parse(JSON.stringify(DEFAULT_SAMPLE_BATCHES));

// ============================================================================
// 3. TRANG THAI HE THONG TOAN CUC (GLOBAL APP STATE)
// ============================================================================
let web3Provider = null;
let web3Signer = null;
let projectCoreContract = null;
let currentAccount = null;
let currentNetwork = null;
let currentActiveTab = "overview";
let isDemoMode = true; // Mac dinh che do trai nghiem mau de khong can ETH that
let simulatedRole = "ALL"; // Che do gia lap vai tro cho nguoi dung thu nghiem

let userRoles = {
  isAdmin: true,
  isProducer: true,
  isLogistics: true,
  isRetailer: true,
  isInspector: true
};
let producerStakeBalance = "0.05"; // Gia lap co san 0.05 ETH coc hop le
let batchCreationFeeEth = "0.001";

// ============================================================================
// 4. HE THONG TOAST THONG BAO CHUYEN NGHIEP
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
function showToast(message, type = "info", title = "", duration = 4500) {
  return Toast.show(message, type, title, duration);
}

// ============================================================================
// 5. CAC HAM TIEN ICH DINH DANG & HELPER
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

function translateContractError(err) {
  const errStr = (err && (err.data?.message || err.message || err.toString())) || "";
  console.warn("Loi on-chain:", err);

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
    return "⚠️ Người dùng đã từ chối ký xác nhận giao dịch trên ví MetaMask.";
  }
  return "Lỗi giao dịch: " + (err.reason || errStr.substring(0, 150));
}

// ============================================================================
// 6. DIEU HUONG TAB KHONG GIAN LAM VIEC (WORKSPACES)
// ============================================================================
const TAB_BREADCRUMBS = {
  overview: "Tổng quan",
  lookup: "Tra cứu nguồn gốc",
  create: "Tạo lô hàng",
  checkpoints: "Ghi nhận chặng",
  verify: "Kiểm định",
  stake: "Ký quỹ",
  admin: "Quản trị"
};

function switchTab(tabId) {
  currentActiveTab = tabId;

  // 1. Cap nhat active item tren Sidebar
  const navItems = document.querySelectorAll(".sidebar-nav-item");
  navItems.forEach(item => {
    if (item.dataset.tab === tabId) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  // 2. Cap nhat breadcrumb tren Header
  const breadcrumbEl = document.getElementById("headerBreadcrumbTab");
  if (breadcrumbEl) {
    breadcrumbEl.innerText = TAB_BREADCRUMBS[tabId] || "Tổng quan";
  }

  // 3. An/hien cac Section Container
  const tabViews = document.querySelectorAll(".tab-view-container");
  tabViews.forEach(view => {
    if (view.id === `view-${tabId}`) {
      view.style.display = "block";
    } else {
      view.style.display = "none";
    }
  });

  // 4. Dong Sidebar tren di dong sau khi bam chon
  const sidebar = document.getElementById("appSidebar");
  if (sidebar && sidebar.classList.contains("mobile-open")) {
    sidebar.classList.remove("mobile-open");
    const overlay = document.getElementById("sidebarOverlay");
    if (overlay) overlay.style.display = "none";
  }

  // Cuon ve dau trang
  window.scrollTo({ top: 0, behavior: "smooth" });

  // 5. Khoi tao hoac lam moi du lieu cua tab tuong ung
  if (tabId === "overview") {
    renderOverviewDashboard();
  } else if (tabId === "create") {
    renderCreatedBatchesTable();
  } else if (tabId === "checkpoints") {
    populateBatchSelectOptions("checkpointBatchSelect");
  } else if (tabId === "verify") {
    populateBatchSelectOptions("verifyBatchSelect");
  } else if (tabId === "stake") {
    updateStakeDisplay();
  }
}

// ============================================================================
// 7. KHOI TAO DU LIEU DASHBOARD TONG QUAN (MATCH SCREENSHOT 1:1)
// ============================================================================
function renderOverviewDashboard() {
  const batchesList = Object.values(SAMPLE_BATCHES);
  const totalBatches = batchesList.length;
  const verifiedCount = batchesList.filter(b => b.isVerified).length;

  // Cap nhat 4 the Metric
  const elTotal = document.getElementById("statTotalBatches");
  const elVerified = document.getElementById("statVerifiedBatches");
  const elFee = document.getElementById("statBatchFee");
  const elMinStake = document.getElementById("statMinStake");

  if (elTotal) elTotal.innerText = totalBatches;
  if (elVerified) elVerified.innerText = verifiedCount;
  if (elFee) elFee.innerText = batchCreationFeeEth;
  if (elMinStake) elMinStake.innerText = "0.05";

  // Render bang Danh sach lo hang gan day tren Tong quan
  const tbody = document.getElementById("overviewBatchesTbody");
  if (tbody) {
    tbody.innerHTML = "";
    batchesList.forEach(batch => {
      const tr = document.createElement("tr");
      const badgeClass = batch.isVerified ? "badge-status-verified" : "badge-status-pending";
      const badgeText = batch.isVerified ? "✓ Đã kiểm định" : "⏳ Chờ kiểm định";

      tr.innerHTML = `
        <td class="font-code font-bold text-primary">${batch.batchCode}</td>
        <td>
          <div class="product-name-cell">${batch.productName}</div>
          <div class="product-origin-cell">${batch.origin}</div>
        </td>
        <td><span class="status-pill ${badgeClass}">${badgeText}</span></td>
        <td>${batch.quantity || "1.000 hộp"}</td>
        <td>
          <div class="table-actions">
            <button class="btn-action-sm btn-action-view" onclick="quickTraceBatch('${batch.batchCode}')" title="Xem chi tiết nguồn gốc">
              Tra Cứu
            </button>
            <button class="btn-action-sm btn-action-qr" onclick="openBatchQrModal('${batch.batchCode}')" title="Xem tem mã QR">
              Tem QR
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }
}

// Chuyen nhanh sang tab Tra cuu voi ma lo da chon
function quickTraceBatch(batchCode) {
  switchTab("lookup");
  const input = document.getElementById("lookupInput");
  if (input) {
    input.value = batchCode;
    executeSearch(batchCode);
  }
}

// ============================================================================
// 8. CHE DO TRAI NGHIEM MAU (DEMO MODE CONTROLLER)
// ============================================================================
function toggleDemoDropdown() {
  const menu = document.getElementById("demoDropdownMenu");
  if (menu) {
    menu.classList.toggle("show");
  }
}

// Dong dropdown khi bam ra ngoai
window.addEventListener("click", (e) => {
  if (!e.target.closest("#demoDropdownWrapper")) {
    const menu = document.getElementById("demoDropdownMenu");
    if (menu && menu.classList.contains("show")) {
      menu.classList.remove("show");
    }
  }
});

function setDemoRole(role) {
  simulatedRole = role;
  const roleLabels = {
    ALL: "Toàn quyền (Demo)",
    PRODUCER: "Cơ sở sản xuất",
    LOGISTICS: "Vận chuyển",
    RETAILER: "Đại lý bán lẻ",
    INSPECTOR: "Kiểm định viên",
    ADMIN: "Quản trị viên"
  };

  userRoles = {
    isAdmin: role === "ALL" || role === "ADMIN",
    isProducer: role === "ALL" || role === "PRODUCER",
    isLogistics: role === "ALL" || role === "LOGISTICS",
    isRetailer: role === "ALL" || role === "RETAILER",
    isInspector: role === "ALL" || role === "INSPECTOR"
  };

  showToast(`Đã chuyển vai trò giả lập sang: ${roleLabels[role] || role}`, "info", "Chuyển Đổi Vai Trò");
  toggleDemoDropdown();
}

function resetDemoData() {
  SAMPLE_BATCHES = JSON.parse(JSON.stringify(DEFAULT_SAMPLE_BATCHES));
  localStorage.setItem("HueLegend_Batches", JSON.stringify(SAMPLE_BATCHES));
  renderOverviewDashboard();
  renderCreatedBatchesTable();
  showToast("Đã khôi phục toàn bộ 6 lô đặc sản Huế mẫu về trạng thái ban đầu!", "success", "Đặt Lại Dữ Liệu Mẫu");
}

// ============================================================================
// 9. KET NOI VI METAMASK (ETHERS.JS V5)
// ============================================================================
async function connectWallet() {
  if (typeof window.ethereum === "undefined") {
    showToast("Không tìm thấy tiện ích MetaMask. Đang chạy ở Chế độ Trải nghiệm Mẫu!", "info", "Chế Độ Trực Quan");
    currentAccount = "0x82d022a704706B2f144863D619D7418F8a0f19A7";
    updateWalletUI();
    return currentAccount;
  }

  const toastLoading = showToast("Đang kết nối tới ví MetaMask...", "loading", "Kết Nối Web3");

  try {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    if (!accounts || accounts.length === 0) {
      throw new Error("Người dùng chưa cấp quyền truy cập tài khoản ví.");
    }

    currentAccount = accounts[0];
    web3Provider = new ethers.providers.Web3Provider(window.ethereum);
    web3Signer = web3Provider.getSigner();
    currentNetwork = await web3Provider.getNetwork();

    if (currentNetwork.chainId !== SEPOLIA_DECIMAL_ID) {
      showToast("Khuyến nghị chuyển mạng sang Sepolia Testnet để tương tác Smart Contract!", "warning", "Mạng Blockchain");
      await requestSwitchToSepolia();
    }

    projectCoreContract = new ethers.Contract(CONTRACT_ADDRESS, PROJECT_CORE_ABI, web3Signer);
    await checkAccountRoles(currentAccount);

    toastLoading.update(`Đã kết nối ví: ${shortenAddress(currentAccount)}`, "success", "Kết Nối Thành Công");
    updateWalletUI();
    return currentAccount;
  } catch (err) {
    console.error("Loi ket noi MetaMask:", err);
    toastLoading.update(translateContractError(err), "error", "Kết Nối Thất Bại");
    return null;
  }
}

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

async function checkAccountRoles(account) {
  if (!projectCoreContract || !account) return;

  try {
    const ownerAddress = await projectCoreContract.owner().catch(() => ethers.constants.AddressZero);
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

    try {
      const stakeWei = await projectCoreContract.producerStake(account);
      producerStakeBalance = ethers.utils.formatEther(stakeWei);
    } catch {
      producerStakeBalance = "0.05";
    }

    try {
      const feeWei = await projectCoreContract.batchCreationFee();
      batchCreationFeeEth = ethers.utils.formatEther(feeWei);
    } catch {
      batchCreationFeeEth = "0.001";
    }
  } catch (err) {
    console.warn("Khong the truy van vai tro tu Smart Contract:", err);
  }
}

function updateWalletUI() {
  const btnConnect = document.getElementById("btnConnectWallet");
  const walletBadge = document.getElementById("walletBadge");
  const walletAddrText = document.getElementById("walletAddressText");

  if (!btnConnect) return;

  if (currentAccount) {
    btnConnect.style.display = "none";
    if (walletBadge) {
      walletBadge.style.display = "inline-flex";
      if (walletAddrText) walletAddrText.innerText = shortenAddress(currentAccount);
    }
  } else {
    btnConnect.style.display = "inline-flex";
    if (walletBadge) walletBadge.style.display = "none";
  }
}

// Lang nghe su kien MetaMask doi tai khoan va chain
if (typeof window.ethereum !== "undefined") {
  window.ethereum.on("accountsChanged", async (accounts) => {
    if (accounts.length === 0) {
      currentAccount = null;
      showToast("Ví MetaMask đã ngắt kết nối.", "warning", "Ngắt Kết Nối");
    } else {
      currentAccount = accounts[0];
      if (web3Provider) {
        web3Signer = web3Provider.getSigner();
        projectCoreContract = new ethers.Contract(CONTRACT_ADDRESS, PROJECT_CORE_ABI, web3Signer);
        await checkAccountRoles(currentAccount);
      }
      showToast(`Đã chuyển sang ví: ${shortenAddress(currentAccount)}`, "info", "Đổi Tài Khoản");
    }
    updateWalletUI();
  });

  window.ethereum.on("chainChanged", () => {
    window.location.reload();
  });
}

// ============================================================================
// 10. TRA CUU NGUON GOC DAC SAN (LOOKUP & CERTIFICATE VIEW)
// ============================================================================
async function fetchBatchDetails(batchCode) {
  if (!batchCode) return null;
  const cleanCode = batchCode.trim();

  // 1. Thu goi on-chain qua Smart Contract neu co ket noi
  if (projectCoreContract) {
    try {
      const batchData = await projectCoreContract.getBatch(cleanCode);
      if (batchData && batchData.exists) {
        const checkpointsData = await projectCoreContract.getCheckpoints(cleanCode);
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
          checkpoints: checkpoints
        };
      }
    } catch (err) {
      console.warn("Khong tim thay tren on-chain, kiem tra bo nho mau:", err.message);
    }
  }

  // 2. Kiem tra kho du lieu mau
  if (SAMPLE_BATCHES[cleanCode]) {
    return SAMPLE_BATCHES[cleanCode];
  }

  return null;
}

function handleLookupSubmit() {
  const input = document.getElementById("lookupInput");
  if (!input) return;
  const code = input.value.trim();
  if (!code) {
    showToast("Vui lòng nhập mã lô hàng cần tra cứu!", "warning", "Thiếu Mã Lô");
    return;
  }
  executeSearch(code);
}

function quickSearch(code) {
  const input = document.getElementById("lookupInput");
  if (input) input.value = code;
  executeSearch(code);
}

async function executeSearch(batchCode) {
  const toastProgress = showToast(`Đang truy vấn hồ sơ lô hàng ${batchCode}...`, "loading", "Truy Vấn Nguồn Gốc");

  try {
    const batch = await fetchBatchDetails(batchCode);
    if (!batch) {
      toastProgress.update(`Không tìm thấy hồ sơ cho mã: ${batchCode}. Vui lòng kiểm tra lại!`, "error", "Không Tìm Thấy");
      document.getElementById("certificateCard").style.display = "none";
      document.getElementById("timelineSection").style.display = "none";
      return;
    }

    toastProgress.update(`Đã xác thực thành công hồ sơ lô hàng ${batchCode}!`, "success", "Xác Thực Thành Công");

    // Hien thi Chung thu
    document.getElementById("certProductName").innerText = batch.productName;
    document.getElementById("certBatchCode").innerText = batch.batchCode;
    document.getElementById("certOrigin").innerText = batch.origin;
    document.getElementById("certProducerAddress").innerText = "Ví sản xuất: " + shortenAddress(batch.producer);
    document.getElementById("certCreatedAt").innerText = formatTimestamp(batch.createdAt);
    document.getElementById("certQuantity").innerText = batch.quantity || "1.000 hộp";
    document.getElementById("certOcopBadge").innerText = "★ " + (batch.ocopStandard || "OCOP 4 Sao Huế");

    const certCard = document.getElementById("certificateCard");
    certCard.style.display = "block";

    // Render Timeline 3 chang
    renderTimeline(batch.checkpoints);
    document.getElementById("timelineSection").style.display = "block";

    certCard.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (err) {
    console.error("Loi truy van:", err);
    toastProgress.update("Có lỗi khi truy vấn dữ liệu từ hệ thống.", "error", "Lỗi Truy Vấn");
  }
}

function renderTimeline(checkpoints) {
  const container = document.getElementById("timelineContainer");
  if (!container) return;
  container.innerHTML = "";

  if (!checkpoints || checkpoints.length === 0) {
    container.innerHTML = `<div class="empty-timeline">Chưa có thông tin chặng nào được ghi nhận cho lô hàng này.</div>`;
    return;
  }

  checkpoints.forEach((cp, idx) => {
    const isLast = (idx === checkpoints.length - 1);
    let roleClass = "role-producer";
    let icon = "🌿";
    let roleName = cp.roleTitle || "Cơ Sở Sản Xuất";

    if (cp.role === ROLE_HASHES.ROLE_LOGISTICS || (cp.roleTitle && cp.roleTitle.includes("Vận Chuyển"))) {
      roleClass = "role-logistics";
      icon = "🚚";
    } else if (cp.role === ROLE_HASHES.ROLE_RETAILER || (cp.roleTitle && cp.roleTitle.includes("Đại Lý"))) {
      roleClass = "role-retailer";
      icon = "🏪";
    } else if (cp.role === ROLE_HASHES.ROLE_INSPECTOR || (cp.roleTitle && cp.roleTitle.includes("Kiểm Định"))) {
      roleClass = "role-inspector";
      icon = "🛡️";
    }

    const etherscanUrl = cp.txHash ? `${ETHERSCAN_BASE_URL}/tx/${cp.txHash}` : "#";

    const itemHtml = `
      <div class="timeline-item">
        <div class="timeline-node ${isLast ? 'active-pulse' : ''}">${icon}</div>
        <div class="timeline-card">
          <div class="timeline-header">
            <span class="step-role-badge ${roleClass}">${roleName}</span>
            <span class="timeline-time">🕒 ${formatTimestamp(cp.timestamp)}</span>
          </div>
          <h4 class="timeline-step-name">${cp.stepName || `Chặng ${idx + 1}`}</h4>
          <p class="timeline-action-text">${cp.action}</p>
          
          <div class="timeline-meta-box">
            <div class="meta-row"><strong>📍 Vị trí:</strong> <span>${cp.location}</span></div>
            <div class="meta-row"><strong>❄️ Điều kiện:</strong> <span>${cp.conditionNote || "Nhiệt độ phòng ổn định"}</span></div>
            <div class="meta-row"><strong>✍️ Ví ký:</strong> <span class="hash-code">${cp.recorder}</span></div>
            <div class="meta-row"><strong>🔗 TxHash:</strong> <a href="${etherscanUrl}" target="_blank" class="hash-link hash-code">${shortenAddress(cp.txHash)} ↗</a></div>
          </div>
        </div>
      </div>
    `;
    container.insertAdjacentHTML("beforeend", itemHtml);
  });
}

// ============================================================================
// 11. TAO LO DAC SAN HOANG GIA (CREATE BATCH WORKSPACE)
// ============================================================================
async function handleCreateBatchSubmit(event) {
  event.preventDefault();

  const productName = document.getElementById("inpProductName").value.trim();
  const batchCode = document.getElementById("inpBatchCode").value.trim().toUpperCase();
  const originLocation = document.getElementById("inpOriginLocation").value.trim();
  const quantity = document.getElementById("inpQuantity").value.trim();
  const initialNote = document.getElementById("inpInitialNote").value.trim();

  if (!productName || !batchCode || !originLocation || !quantity) {
    showToast("Vui lòng điền đầy đủ các thông tin bắt buộc có dấu (*)!", "warning", "Thiếu Thông Tin");
    return;
  }

  if (SAMPLE_BATCHES[batchCode]) {
    showToast(`Mã lô ${batchCode} đã tồn tại! Vui lòng chọn mã định danh khác.`, "error", "Trùng Mã Lô");
    return;
  }

  // Truong hop 1: Co ket noi MetaMask va khong o che do Demo thuan tuy
  if (projectCoreContract && web3Signer && !isDemoMode) {
    const toastProgress = showToast("Đang chuẩn bị gửi giao dịch tạo lô lên Blockchain...", "loading", "Khởi Tạo Lô Hàng");
    try {
      const feeWei = ethers.utils.parseEther(batchCreationFeeEth);
      const tx = await projectCoreContract.createBatch(batchCode, productName, originLocation, initialNote, {
        value: feeWei
      });
      toastProgress.update(`Giao dịch đã phát sóng (${shortenAddress(tx.hash)}). Đang chờ thợ đào...`, "loading", "Xác Nhận Khối");
      const receipt = await tx.wait();
      toastProgress.update(`Khởi tạo lô ${batchCode} thành công!`, "success", "Hoàn Tất");
    } catch (err) {
      toastProgress.update(translateContractError(err), "error", "Thất Bại");
      return;
    }
  } else {
    // Truong hop 2: Che do Trai nghiem mau (Demo Mock Mode)
    showToast(`Khởi tạo lô đặc sản "${productName}" (${batchCode}) thành công trong Chế độ Mẫu!`, "success", "Tạo Lô Thành Công");
  }

  // Cap nhat vao State & LocalStorage
  const newBatch = {
    batchCode: batchCode,
    productName: productName,
    origin: originLocation,
    createdAt: Math.floor(Date.now() / 1000),
    producer: currentAccount || "0x82d022a704706B2f144863D619D7418F8a0f19A7",
    isVerified: false,
    exists: true,
    ocopStandard: "Đang Chờ Kiểm Định OCOP",
    certificationNo: "BATCH-CREATED-" + batchCode,
    quantity: quantity,
    currentStage: "Tại xưởng sản xuất",
    checkpoints: [
      {
        stepName: "Chặng 1: Sản Xuất & Đóng Gói",
        role: "ROLE_PRODUCER",
        roleTitle: "Cơ Sở Sản Xuất",
        location: originLocation,
        action: `Khởi tạo lô hàng, nộp phí ${batchCreationFeeEth} ETH vào Quỹ OCOP. ${initialNote}`,
        timestamp: Math.floor(Date.now() / 1000),
        recorder: currentAccount || "0x82d022a704706B2f144863D619D7418F8a0f19A7",
        metadataURI: initialNote,
        txHash: "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(""),
        conditionNote: initialNote || "Đóng gói theo tiêu chuẩn OCOP."
      }
    ]
  };

  SAMPLE_BATCHES[batchCode] = newBatch;
  localStorage.setItem("HueLegend_Batches", JSON.stringify(SAMPLE_BATCHES));

  // Reset form
  document.getElementById("createBatchForm").reset();

  // Lam moi bang danh sach
  renderOverviewDashboard();
  renderCreatedBatchesTable();

  // Tu dong mo Modal tem QR cho lo vua tao
  openBatchQrModal(batchCode);
}

function renderCreatedBatchesTable() {
  const tbody = document.getElementById("createdBatchesTbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  Object.values(SAMPLE_BATCHES).forEach(batch => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="font-code font-bold text-primary">${batch.batchCode}</td>
      <td><strong>${batch.productName}</strong></td>
      <td>${formatTimestamp(batch.createdAt)}</td>
      <td>${batch.quantity || "1.000 hộp"}</td>
      <td><span class="status-pill ${batch.isVerified ? 'badge-status-verified' : 'badge-status-pending'}">${batch.isVerified ? 'Đã kiểm định' : 'Chờ kiểm định'}</span></td>
      <td>
        <button class="btn-action-sm btn-action-qr" onclick="openBatchQrModal('${batch.batchCode}')">
          In Tem QR
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function populateBatchSelectOptions(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;
  const currentVal = select.value;
  select.innerHTML = '<option value="">-- Chọn mã lô hàng --</option>';

  Object.values(SAMPLE_BATCHES).forEach(b => {
    const opt = document.createElement("option");
    opt.value = b.batchCode;
    opt.innerText = `${b.batchCode} - ${b.productName}`;
    select.appendChild(opt);
  });

  if (currentVal && SAMPLE_BATCHES[currentVal]) {
    select.value = currentVal;
  }
}

// ============================================================================
// 12. GHI NHAN CHANG CHUOI CUNG UNG (CHECKPOINTS WORKSPACE)
// ============================================================================
async function handleAddCheckpointSubmit(event) {
  event.preventDefault();

  const batchCode = document.getElementById("checkpointBatchSelect").value;
  const roleType = document.getElementById("checkpointRoleSelect").value;
  const location = document.getElementById("checkpointLocation").value.trim();
  const actionDesc = document.getElementById("checkpointAction").value.trim();
  const conditionNote = document.getElementById("checkpointNote").value.trim();

  if (!batchCode || !roleType || !location || !actionDesc) {
    showToast("Vui lòng điền đầy đủ các trường thông tin chặng!", "warning", "Thiếu Dữ Liệu");
    return;
  }

  // Kiem tra phan quyen vai tro (RBAC Enforcement)
  if (!userRoles.isAdmin) {
    if (roleType === "LOGISTICS" && !userRoles.isLogistics) {
      showToast("⛔ LỖI PHÂN QUYỀN (Lab 8): Ví của bạn không sở hữu vai trò ROLE_LOGISTICS!", "error", "Truy Cập Bị Chặn");
      return;
    }
    if (roleType === "RETAILER" && !userRoles.isRetailer) {
      showToast("⛔ LỖI PHÂN QUYỀN (Lab 8): Ví của bạn không sở hữu vai trò ROLE_RETAILER!", "error", "Truy Cập Bị Chặn");
      return;
    }
  }

  const roleTitles = {
    LOGISTICS: "Đơn Vị Vận Chuyển",
    RETAILER: "Đại Lý Phân Phối",
    PRODUCER: "Cơ Sở Sản Xuất"
  };

  const newCheckpoint = {
    stepName: `Chặng ${SAMPLE_BATCHES[batchCode].checkpoints.length + 1}: ${roleTitles[roleType]}`,
    role: ROLE_HASHES[`ROLE_${roleType}`] || roleType,
    roleTitle: roleTitles[roleType],
    location: location,
    action: actionDesc,
    timestamp: Math.floor(Date.now() / 1000),
    recorder: currentAccount || "0x82d022a704706B2f144863D619D7418F8a0f19A7",
    metadataURI: conditionNote,
    txHash: "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(""),
    conditionNote: conditionNote || "Đạt chuẩn nhiệt độ và điều kiện lưu kho."
  };

  SAMPLE_BATCHES[batchCode].checkpoints.push(newCheckpoint);
  SAMPLE_BATCHES[batchCode].currentStage = location;
  localStorage.setItem("HueLegend_Batches", JSON.stringify(SAMPLE_BATCHES));

  showToast(`Đã ghi nhận chặng mới thành công cho lô ${batchCode}!`, "success", "Ghi Chặng Thành Công");
  document.getElementById("addCheckpointForm").reset();

  renderOverviewDashboard();
}

// ============================================================================
// 13. KIEM DINH & CHUNG NHAN OCOP (VERIFICATION WORKSPACE)
// ============================================================================
function handleVerifyBatchSubmit(isApprove) {
  const batchCode = document.getElementById("verifyBatchSelect").value;
  const inspectorNote = document.getElementById("verifyInspectorNote").value.trim();
  const certNumber = document.getElementById("verifyCertNo").value.trim();

  if (!batchCode) {
    showToast("Vui lòng chọn mã lô hàng cần kiểm định!", "warning", "Chưa Chọn Lô");
    return;
  }

  // Kiem tra quyen kiem dinh
  if (!userRoles.isAdmin && !userRoles.isInspector) {
    showToast("⛔ LỖI PHÂN QUYỀN: Chỉ tài khoản sở hữu ROLE_INSPECTOR mới có quyền chứng thực hoặc thu hồi kiểm định!", "error", "Từ Chối Truy Cập");
    return;
  }

  if (isApprove) {
    SAMPLE_BATCHES[batchCode].isVerified = true;
    SAMPLE_BATCHES[batchCode].ocopStandard = "OCOP 4 Sao Đã Xác Thực Trên Blockchain";
    SAMPLE_BATCHES[batchCode].certificationNo = certNumber || `OCOP-HUE-2026-${Math.floor(Math.random() * 900 + 100)}`;
    
    // Ghi them chặng kiem dinh
    SAMPLE_BATCHES[batchCode].checkpoints.push({
      stepName: `Chặng ${SAMPLE_BATCHES[batchCode].checkpoints.length + 1}: Kiểm Định & Cấp Tem OCOP`,
      role: ROLE_HASHES.ROLE_INSPECTOR,
      roleTitle: "Cơ Quan Kiểm Định OCOP",
      location: "Chi cục Quản lý Chất lượng Nông Lâm Thủy sản Thừa Thiên Huế",
      action: `Chứng nhận đạt chuẩn OCOP 4 sao và an toàn vệ sinh thực phẩm. ${inspectorNote}`,
      timestamp: Math.floor(Date.now() / 1000),
      recorder: currentAccount || "0x4296dbb7b322384a621147a468d6ef71f28b40d6",
      metadataURI: certNumber,
      txHash: "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(""),
      conditionNote: inspectorNote || "Đạt chuẩn chất lượng hoàng gia."
    });

    showToast(`Đã phê duyệt kiểm định OCOP thành công cho lô ${batchCode}!`, "success", "Kiểm Định Hợp Lệ");
  } else {
    SAMPLE_BATCHES[batchCode].isVerified = false;
    SAMPLE_BATCHES[batchCode].ocopStandard = "Đã Bị Thu Hồi Kiểm Định";
    showToast(`Đã thu hồi kiểm định của lô ${batchCode}!`, "warning", "Thu Hồi Kiểm Định");
  }

  localStorage.setItem("HueLegend_Batches", JSON.stringify(SAMPLE_BATCHES));
  renderOverviewDashboard();
}

// ============================================================================
// 14. KY QUY UY TIN & ESCROW (STAKE WORKSPACE)
// ============================================================================
function updateStakeDisplay() {
  const elBalance = document.getElementById("stakeCurrentBalance");
  if (elBalance) {
    elBalance.innerText = `${producerStakeBalance} ETH`;
  }
}

async function handleDepositStakeAction() {
  const amountEth = document.getElementById("stakeDepositInput").value || "0.05";
  if (projectCoreContract && web3Signer && !isDemoMode) {
    const toastProgress = showToast(`Đang gửi giao dịch nạp ký quỹ ${amountEth} ETH...`, "loading", "Nạp Ký Quỹ");
    try {
      const valWei = ethers.utils.parseEther(amountEth);
      const tx = await projectCoreContract.depositStake({ value: valWei });
      toastProgress.update("Đang đào block xác nhận...", "loading", "Chờ Xác Nhận");
      await tx.wait();
      toastProgress.update(`Nạp ký quỹ ${amountEth} ETH thành công!`, "success", "Nạp Cọc Hoàn Tất");
      producerStakeBalance = (parseFloat(producerStakeBalance) + parseFloat(amountEth)).toFixed(3);
      updateStakeDisplay();
    } catch (err) {
      toastProgress.update(translateContractError(err), "error", "Thất Bại");
    }
  } else {
    producerStakeBalance = (parseFloat(producerStakeBalance) + parseFloat(amountEth)).toFixed(3);
    updateStakeDisplay();
    showToast(`Đã nạp thành công ${amountEth} ETH ký quỹ uy tín (Chế độ Mẫu)! Khóa an toàn 30 ngày.`, "success", "Ký Quỹ Thành Công");
  }
}

async function handleWithdrawStakeAction() {
  showToast("⛔ ĐANG KHÓA CỌC: Tiền ký quỹ đang trong thời gian khóa bảo đảm an toàn 30 ngày (Lab 9 & Lab 11)!", "error", "Cọc Đang Bị Khóa");
}

// ============================================================================
// 15. MODAL XUAT TEM QR CODE DONG & QUET CAMERA
// ============================================================================
let qrCodeInstance = null;
let html5QrScanner = null;

function openBatchQrModal(batchCode) {
  const batch = SAMPLE_BATCHES[batchCode];
  if (!batch) return;

  const modal = document.getElementById("qrModal");
  if (!modal) return;

  document.getElementById("qrModalBatchCode").innerText = batch.batchCode;
  document.getElementById("qrModalProductName").innerText = batch.productName;
  document.getElementById("qrModalOrigin").innerText = batch.origin;

  const qrContainer = document.getElementById("qrCanvasContainer");
  qrContainer.innerHTML = "";

  const traceUrl = `${window.location.origin}${window.location.pathname}?batchId=${encodeURIComponent(batch.batchCode)}`;

  qrCodeInstance = new QRCode(qrContainer, {
    text: traceUrl,
    width: 220,
    height: 220,
    colorDark: "#4A3459",
    colorLight: "#FFFFFF",
    correctLevel: QRCode.CorrectLevel.H
  });

  modal.style.display = "flex";
}

function closeQrModal() {
  const modal = document.getElementById("qrModal");
  if (modal) modal.style.display = "none";
}

function printBatchQr() {
  window.print();
}

function openQrScannerModal() {
  const modal = document.getElementById("qrScannerModal");
  if (!modal) return;
  modal.style.display = "flex";

  if (!html5QrScanner) {
    html5QrScanner = new Html5Qrcode("qrReaderBox");
  }

  html5QrScanner.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: { width: 250, height: 250 } },
    (decodedText) => {
      closeQrScannerModal();
      let detectedBatchId = decodedText;
      try {
        if (decodedText.includes("batchId=") || decodedText.includes("batch=")) {
          const urlObj = new URL(decodedText);
          detectedBatchId = urlObj.searchParams.get("batchId") || urlObj.searchParams.get("batch") || decodedText;
        }
      } catch { }

      showToast(`Quét thành công tem: ${detectedBatchId}`, "success", "Nhận Diện Tem QR");
      switchTab("lookup");
      document.getElementById("lookupInput").value = detectedBatchId;
      executeSearch(detectedBatchId);
    },
    () => { }
  ).catch((err) => {
    console.warn("Loi mo camera:", err);
    showToast("Không thể khởi động camera. Vui lòng cấp quyền truy cập trên trình duyệt!", "error", "Lỗi Camera");
  });
}

function closeQrScannerModal() {
  const modal = document.getElementById("qrScannerModal");
  if (modal) modal.style.display = "none";
  if (html5QrScanner) {
    html5QrScanner.stop().catch(() => { });
  }
}

// Toggle mobile sidebar
function toggleMobileSidebar() {
  const sidebar = document.getElementById("appSidebar");
  const overlay = document.getElementById("sidebarOverlay");
  if (sidebar) sidebar.classList.toggle("mobile-open");
  if (overlay) {
    overlay.style.display = sidebar.classList.contains("mobile-open") ? "block" : "none";
  }
}

// ============================================================================
// 16. KHOI DONG TRANG & LOAD PARAMETERS (INIT ON LOAD)
// ============================================================================
window.addEventListener("DOMContentLoaded", async () => {
  // Khoi tao Dashboard overview
  renderOverviewDashboard();
  renderCreatedBatchesTable();

  // Kiem tra tham so URL ?batchId=... hoac ?tab=...
  const paramBatchId = parseUrlParam("batchId") || parseUrlParam("batch");
  const paramTab = parseUrlParam("tab") || (window.location.hash ? window.location.hash.replace("#", "") : null);

  if (paramBatchId) {
    switchTab("lookup");
    document.getElementById("lookupInput").value = paramBatchId;
    executeSearch(paramBatchId);
  } else if (paramTab && TAB_BREADCRUMBS[paramTab]) {
    switchTab(paramTab);
  } else {
    switchTab("overview");
  }

  // Thu ket noi vi tu dong neu da duoc phep
  if (typeof window.ethereum !== "undefined" && window.ethereum.selectedAddress) {
    await connectWallet();
  }
});
