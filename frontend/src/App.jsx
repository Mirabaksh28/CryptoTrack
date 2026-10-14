import { useEffect, useState } from "react";
import { BrowserProvider, Contract } from "ethers";
import "./App.css";
import cryptoTrackData from "./CryptoTrack.json";

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

function App() {
  const [account, setAccount] = useState("");
  const [holdings, setHoldings] = useState([]);
  const [name, setName] = useState("Bitcoin");
  const [symbol, setSymbol] = useState("BTC");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  async function getContract() {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed.");
    }

    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    return new Contract(
      CONTRACT_ADDRESS,
      cryptoTrackData.abi,
      signer
    );
  }

  async function loadHoldings(address) {
    try {
      if (!address || !window.ethereum) return;

      const provider = new BrowserProvider(window.ethereum);

      const contract = new Contract(
        CONTRACT_ADDRESS,
        cryptoTrackData.abi,
        provider
      );

      const data = await contract.getMyHoldings();

      const formatted = data.map((coin) => ({
        id: Number(coin.id),
        name: coin.coinName,
        symbol: coin.symbol,
        quantity: Number(coin.quantity) / 1000000,
        price: Number(coin.purchasePrice) / 1000000,
      }));

      setHoldings(formatted);
    } catch (error) {
      console.error("Error loading holdings:", error);
      setStatus("Unable to load holdings.");
    }
  }

  async function connectWallet() {
    try {
      if (!window.ethereum) {
        alert("Please install MetaMask.");
        return;
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length > 0) {
        setAccount(accounts[0]);
        await loadHoldings(accounts[0]);
      }
    } catch (error) {
      console.error(error);
      setStatus("Wallet connection failed.");
    }
  }

  async function addHolding(event) {
    event.preventDefault();

    if (!account) {
      alert("Connect MetaMask first.");
      return;
    }

    if (
      !name.trim() ||
      !symbol.trim() ||
      Number(quantity) <= 0 ||
      Number(price) <= 0
    ) {
      alert("Enter valid holding details.");
      return;
    }

    try {
      setLoading(true);
      setStatus("Waiting for transaction...");

      const contract = await getContract();

      const quantityValue = Math.round(Number(quantity) * 1000000);
      const priceValue = Math.round(Number(price) * 1000000);

      const transaction = await contract.addHolding(
        name.trim(),
        symbol.trim().toUpperCase(),
        quantityValue,
        priceValue
      );

      await transaction.wait();

      setQuantity("");
      setPrice("");

      await loadHoldings(account);
      setStatus("Holding added successfully ✓");
    } catch (error) {
      console.error(error);
      setStatus("Transaction failed.");
    } finally {
      setLoading(false);
    }
  }

  async function updateHolding(id, currentQuantity, currentPrice) {
    const newQuantity = window.prompt(
      "Enter new quantity:",
      currentQuantity
    );

    if (newQuantity === null) return;

    const newPrice = window.prompt(
      "Enter new purchase price (USD):",
      currentPrice
    );

    if (newPrice === null) return;

    if (
      Number(newQuantity) <= 0 ||
      Number(newPrice) <= 0
    ) {
      alert("Enter valid values.");
      return;
    }

    try {
      setLoading(true);
      setStatus("Waiting for transaction...");

      const contract = await getContract();

      const quantityValue = Math.round(Number(newQuantity) * 1000000);
      const priceValue = Math.round(Number(newPrice) * 1000000);

      const transaction = await contract.updateHolding(
        id,
        quantityValue,
        priceValue
      );

      await transaction.wait();

      await loadHoldings(account);
      setStatus("Holding updated successfully ✓");
    } catch (error) {
      console.error(error);
      setStatus("Update transaction failed.");
    } finally {
      setLoading(false);
    }
  }

  async function removeHolding(id) {
    try {
      setLoading(true);
      setStatus("Waiting for transaction...");

      const contract = await getContract();

      const transaction = await contract.removeHolding(id);

      await transaction.wait();

      await loadHoldings(account);
      setStatus("Holding removed successfully ✓");
    } catch (error) {
      console.error(error);
      setStatus("Remove transaction failed.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!window.ethereum) return;

    window.ethereum.request({
      method: "eth_accounts",
    }).then((accounts) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        loadHoldings(accounts[0]);
      }
    });

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        setAccount("");
        setHoldings([]);
      } else {
        setAccount(accounts[0]);
        loadHoldings(accounts[0]);
      }
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);

    return () => {
      window.ethereum.removeListener(
        "accountsChanged",
        handleAccountsChanged
      );
    };
  }, []);

  const totalInvested = holdings.reduce(
    (total, coin) => total + coin.quantity * coin.price,
    0
  );

  return (
    <main className="app">

      <header className="topbar">
        <div className="brand">
          <h1>
            <span>₿</span> CryptoTrack
          </h1>

          {account && (
            <div className="wallet-info">
              <span className="online-dot"></span>
              CryptoTrack Local
            </div>
          )}
        </div>

        <div className="wallet-area">
          {!account && (
            <span className="network">Portfolio Tracker</span>
          )}

          <button
            onClick={connectWallet}
            className="connect-btn"
          >
            {account
              ? `${account.slice(0, 6)}...${account.slice(-4)}`
              : "Connect Wallet"}
          </button>
        </div>
      </header>

      <section className="welcome">
        <p className="eyebrow">YOUR CRYPTO OVERVIEW</p>
        <h2>Track your portfolio.</h2>
        <p>Manage your cryptocurrency holdings in one place.</p>
      </section>

      {status && (
        <div className="status-message">
          {status}
        </div>
      )}

      <section className="summary">
        <article className="stat-card">
          <p>Total Investment</p>

          <h2>
            $
            {totalInvested.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </h2>

          <span>Based on entered purchase prices</span>
        </article>

        <article className="stat-card">
          <p>Total Assets</p>
          <h2>{holdings.length}</h2>
          <span>Cryptocurrency entries</span>
        </article>
      </section>

      <section className="panel">
        <h2>Add a Holding</h2>

        <form onSubmit={addHolding} className="holding-form">
          <label>
            Coin name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Bitcoin"
              required
            />
          </label>

          <label>
            Symbol
            <input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="BTC"
              required
            />
          </label>

          <label>
            Quantity
            <input
              type="number"
              min="0.000001"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0.5"
              required
            />
          </label>

          <label>
            Purchase price (USD)
            <input
              type="number"
              min="0.000001"
              step="any"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="50000"
              required
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? "Processing..." : "+ Add Holding"}
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="table-heading">
          <h2>Your Holdings</h2>
          <span>{holdings.length} assets</span>
        </div>

        {holdings.length === 0 ? (
          <p className="empty">
            No holdings yet. Add your first entry above.
          </p>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Cryptocurrency</th>
                  <th>Quantity</th>
                  <th>Purchase Price</th>
                  <th>Invested Value</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {holdings.map((coin) => (
                  <tr key={coin.id}>
                    <td>
                      <strong>{coin.name}</strong>
                      <span className="symbol">{coin.symbol}</span>
                    </td>

                    <td>{coin.quantity}</td>

                    <td>
                      $
                      {coin.price.toLocaleString("en-US", {
                        maximumFractionDigits: 6,
                      })}
                    </td>

                    <td>
                      $
                      {(coin.quantity * coin.price).toLocaleString(
                        "en-US",
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}
                    </td>

                    <td className="actions">
                      <button
                        className="update"
                        onClick={() =>
                          updateHolding(
                            coin.id,
                            coin.quantity,
                            coin.price
                          )
                        }
                        disabled={loading}
                      >
                        Update
                      </button>

                      <button
                        className="remove"
                        onClick={() => removeHolding(coin.id)}
                        disabled={loading}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer>
        CryptoTrack · Blockchain Portfolio Project
      </footer>

    </main>
  );
}

export default App;