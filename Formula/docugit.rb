# Updated automatically by the Release workflow after each main-branch release.
# Install: brew tap xiaoheiCat/docugit https://github.com/xiaoheiCat/docugit && brew install docugit

class Docugit < Formula
  desc "Git-based version control for Office OpenXML documents"
  homepage "https://github.com/xiaoheiCat/docugit"
  version "2026.06.02_03.13.24_a3d89e"
  license "GPL-3.0"

  on_macos do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_03.13.24_a3d89e/docugit-darwin-arm64"
      sha256 "a2d80ecdda4322fb696227c068412b5ce05b391d8892d552dcb9d5247da82555"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_03.13.24_a3d89e/docugit-darwin-amd64"
      sha256 "3324de75ba242bde0b4db2e27663b8f64e7eb09fd95947fbe100eff442d1ea17"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_03.13.24_a3d89e/docugit-linux-arm64"
      sha256 "0c5d99402d79d456805131e922ac26cf24f060bc8d711766d2028582694c0197"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_03.13.24_a3d89e/docugit-linux-amd64"
      sha256 "cc24d07e4a30a814dafff85903f47798a73af64672a5abbfdaf62ad655fcfef6"
    end
  end

  def install
    if OS.mac?
      binary = Hardware::CPU.arm? ? "docugit-darwin-arm64" : "docugit-darwin-amd64"
    else
      binary = Hardware::CPU.arm? ? "docugit-linux-arm64" : "docugit-linux-amd64"
    end
    bin.install binary => "docugit"
  end

  test do
    system "#{bin}/docugit", "--version"
  end
end
