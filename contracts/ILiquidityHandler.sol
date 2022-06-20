// SPDX-License-Identifier: MIT
// !! THIS FILE WAS AUTOGENERATED BY abi-to-sol v0.5.3. SEE SOURCE BELOW. !!
pragma solidity ^0.8.4;

interface ILiquidityHandler {
    struct AdapterInfo {
        string name;
        uint256 percentage;
        address adapterAddress;
        bool status;
    }

    struct Withdrawal {
        address user;
        address token;
        uint256 amount;
        uint256 time;
    }

    event AddedToQueue(
        address ibAlluo,
        address indexed user,
        address token,
        uint256 amount,
        uint256 queueIndex,
        uint256 requestTime
    );
    event AdminChanged(address previousAdmin, address newAdmin);
    event BeaconUpgraded(address indexed beacon);
    event EnoughToSatisfy(
        address ibAlluo,
        uint256 inPoolAfterDeposit,
        uint256 totalAmountInWithdrawals
    );
    event Initialized(uint8 version);
    event Paused(address account);
    event RoleAdminChanged(
        bytes32 indexed role,
        bytes32 indexed previousAdminRole,
        bytes32 indexed newAdminRole
    );
    event RoleGranted(
        bytes32 indexed role,
        address indexed account,
        address indexed sender
    );
    event RoleRevoked(
        bytes32 indexed role,
        address indexed account,
        address indexed sender
    );
    event Unpaused(address account);
    event Upgraded(address indexed implementation);
    event WithdrawalSatisfied(
        address ibAlluo,
        address indexed user,
        address token,
        uint256 amount,
        uint256 queueIndex,
        uint256 satisfiedTime
    );

    function DEFAULT_ADMIN_ROLE() external view returns (bytes32);

    function UPGRADER_ROLE() external view returns (bytes32);

    function adapterIdsToAdapterInfo(uint256)
        external
        view
        returns (
            string memory name,
            uint256 percentage,
            address adapterAddress,
            bool status
        );

    function changeAdapterStatus(uint256 _id, bool _status) external;

    function changeUpgradeStatus(bool _status) external;

    function deposit(address _token, uint256 _amount) external;

    function exchangeAddress() external view returns (address);

    function getActiveAdapters()
        external
        view
        returns (ILiquidityHandler.AdapterInfo[] memory, address[] memory);

    function getAdapterAmount(address _ibAlluo) external view returns (uint256);

    function getAdapterCoreTokensFromIbAlluo(address _ibAlluo)
        external
        view
        returns (address, address);

    function getAdapterId(address _ibAlluo) external view returns (uint256);

    function getAllAdapters()
        external
        view
        returns (ILiquidityHandler.AdapterInfo[] memory, address[] memory);

    function getExpectedAdapterAmount(address _ibAlluo, uint256 _newAmount)
        external
        view
        returns (uint256);

    function getIbAlluoByAdapterId(uint256 _adapterId)
        external
        view
        returns (address);

    function getLastAdapterIndex() external view returns (uint256);

    function getListOfIbAlluos() external view returns (address[] memory);

    function getRoleAdmin(bytes32 role) external view returns (bytes32);

    function getWithdrawal(address _ibAlluo, uint256 _id)
        external
        view
        returns (ILiquidityHandler.Withdrawal memory);

    function grantRole(bytes32 role, address account) external;

    function hasRole(bytes32 role, address account)
        external
        view
        returns (bool);

    function ibAlluoToWithdrawalSystems(address)
        external
        view
        returns (
            uint256 lastWithdrawalRequest,
            uint256 lastSatisfiedWithdrawal,
            uint256 totalWithdrawalAmount,
            bool resolverTrigger
        );

    function initialize(address _multiSigWallet, address _exchangeAddress)
        external;

    function pause() external;

    function paused() external view returns (bool);

    function proxiableUUID() external view returns (bytes32);

    function removeTokenByAddress(
        address _address,
        address _to,
        uint256 _amount
    ) external;

    function renounceRole(bytes32 role, address account) external;

    function revokeRole(bytes32 role, address account) external;

    function satisfyAdapterWithdrawals(address _ibAlluo) external;

    function satisfyAllWithdrawals() external;

    function setAdapter(
        uint256 _id,
        string memory _name,
        uint256 _percentage,
        address _adapterAddress,
        bool _status
    ) external;

    function setExchangeAddress(address newExchangeAddress) external;

    function setIbAlluoToAdapterId(address _ibAlluo, uint256 _adapterId)
        external;

    function supportsInterface(bytes4 interfaceId) external view returns (bool);

    function unpause() external;

    function upgradeStatus() external view returns (bool);

    function upgradeTo(address newImplementation) external;

    function upgradeToAndCall(address newImplementation, bytes memory data)
        external
        payable;

    function withdraw(
        address _user,
        address _token,
        uint256 _amount,
        address _outputToken
    ) external;

    function withdraw(
        address _user,
        address _token,
        uint256 _amount
    ) external;

    function withdrawalInDifferentTokenPossible(
        address _ibAlluo,
        uint256 _amount
    ) external view returns (bool);
}

// THIS FILE WAS AUTOGENERATED FROM THE FOLLOWING ABI JSON:
/*
[{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"ibAlluo","type":"address"},{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"address","name":"token","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"queueIndex","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"requestTime","type":"uint256"}],"name":"AddedToQueue","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"previousAdmin","type":"address"},{"indexed":false,"internalType":"address","name":"newAdmin","type":"address"}],"name":"AdminChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"beacon","type":"address"}],"name":"BeaconUpgraded","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"ibAlluo","type":"address"},{"indexed":false,"internalType":"uint256","name":"inPoolAfterDeposit","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"totalAmountInWithdrawals","type":"uint256"}],"name":"EnoughToSatisfy","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint8","name":"version","type":"uint8"}],"name":"Initialized","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"account","type":"address"}],"name":"Paused","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"previousAdminRole","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"newAdminRole","type":"bytes32"}],"name":"RoleAdminChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"RoleGranted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"RoleRevoked","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"account","type":"address"}],"name":"Unpaused","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"implementation","type":"address"}],"name":"Upgraded","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"ibAlluo","type":"address"},{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"address","name":"token","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"queueIndex","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"satisfiedTime","type":"uint256"}],"name":"WithdrawalSatisfied","type":"event"},{"inputs":[],"name":"DEFAULT_ADMIN_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"UPGRADER_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"adapterIdsToAdapterInfo","outputs":[{"internalType":"string","name":"name","type":"string"},{"internalType":"uint256","name":"percentage","type":"uint256"},{"internalType":"address","name":"adapterAddress","type":"address"},{"internalType":"bool","name":"status","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_id","type":"uint256"},{"internalType":"bool","name":"_status","type":"bool"}],"name":"changeAdapterStatus","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bool","name":"_status","type":"bool"}],"name":"changeUpgradeStatus","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_token","type":"address"},{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"deposit","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"exchangeAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getActiveAdapters","outputs":[{"components":[{"internalType":"string","name":"name","type":"string"},{"internalType":"uint256","name":"percentage","type":"uint256"},{"internalType":"address","name":"adapterAddress","type":"address"},{"internalType":"bool","name":"status","type":"bool"}],"internalType":"struct LiquidityHandler.AdapterInfo[]","name":"","type":"tuple[]"},{"internalType":"address[]","name":"","type":"address[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_ibAlluo","type":"address"}],"name":"getAdapterAmount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_ibAlluo","type":"address"}],"name":"getAdapterCoreTokensFromIbAlluo","outputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_ibAlluo","type":"address"}],"name":"getAdapterId","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getAllAdapters","outputs":[{"components":[{"internalType":"string","name":"name","type":"string"},{"internalType":"uint256","name":"percentage","type":"uint256"},{"internalType":"address","name":"adapterAddress","type":"address"},{"internalType":"bool","name":"status","type":"bool"}],"internalType":"struct LiquidityHandler.AdapterInfo[]","name":"","type":"tuple[]"},{"internalType":"address[]","name":"","type":"address[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_ibAlluo","type":"address"},{"internalType":"uint256","name":"_newAmount","type":"uint256"}],"name":"getExpectedAdapterAmount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_adapterId","type":"uint256"}],"name":"getIbAlluoByAdapterId","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getLastAdapterIndex","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getListOfIbAlluos","outputs":[{"internalType":"address[]","name":"","type":"address[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"}],"name":"getRoleAdmin","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_ibAlluo","type":"address"},{"internalType":"uint256","name":"_id","type":"uint256"}],"name":"getWithdrawal","outputs":[{"components":[{"internalType":"address","name":"user","type":"address"},{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint256","name":"time","type":"uint256"}],"internalType":"struct LiquidityHandler.Withdrawal","name":"","type":"tuple"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"grantRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"hasRole","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"ibAlluoToWithdrawalSystems","outputs":[{"internalType":"uint256","name":"lastWithdrawalRequest","type":"uint256"},{"internalType":"uint256","name":"lastSatisfiedWithdrawal","type":"uint256"},{"internalType":"uint256","name":"totalWithdrawalAmount","type":"uint256"},{"internalType":"bool","name":"resolverTrigger","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_multiSigWallet","type":"address"},{"internalType":"address","name":"_exchangeAddress","type":"address"}],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"pause","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"paused","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"proxiableUUID","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_address","type":"address"},{"internalType":"address","name":"_to","type":"address"},{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"removeTokenByAddress","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"renounceRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"revokeRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_ibAlluo","type":"address"}],"name":"satisfyAdapterWithdrawals","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"satisfyAllWithdrawals","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_id","type":"uint256"},{"internalType":"string","name":"_name","type":"string"},{"internalType":"uint256","name":"_percentage","type":"uint256"},{"internalType":"address","name":"_adapterAddress","type":"address"},{"internalType":"bool","name":"_status","type":"bool"}],"name":"setAdapter","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newExchangeAddress","type":"address"}],"name":"setExchangeAddress","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_ibAlluo","type":"address"},{"internalType":"uint256","name":"_adapterId","type":"uint256"}],"name":"setIbAlluoToAdapterId","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"unpause","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"upgradeStatus","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"newImplementation","type":"address"}],"name":"upgradeTo","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newImplementation","type":"address"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"upgradeToAndCall","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"_user","type":"address"},{"internalType":"address","name":"_token","type":"address"},{"internalType":"uint256","name":"_amount","type":"uint256"},{"internalType":"address","name":"_outputToken","type":"address"}],"name":"withdraw","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_user","type":"address"},{"internalType":"address","name":"_token","type":"address"},{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"withdraw","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_ibAlluo","type":"address"},{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"withdrawalInDifferentTokenPossible","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"}]
*/
