# Updated automatically by the Release workflow after each main-branch release.
# Install: brew tap xiaoheiCat/docugit https://github.com/xiaoheiCat/docugit && brew install docugit

class Docugit < Formula
  desc "Git-based version control for Office OpenXML documents"
  homepage "https://github.com/xiaoheiCat/docugit"
  version "2026.06.02_09.41.38_e89edf"
  license "GPL-3.0"

  on_macos do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_09.41.38_e89edf/docugit-darwin-arm64"
      sha256 "acd9f3ea34003c527057e91973d8addb5db09095f679adcc35312b081dc4b184"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_09.41.38_e89edf/docugit-darwin-amd64"
      sha256 "7be1681e54b9524b00d709ff29cf88c372bc9838861d4c604f5827b62cc6aebf"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_09.41.38_e89edf/docugit-linux-arm64"
      sha256 "f3964f863d5c12ff1db1050cddb411d9e69d92472f14e24c9c2dae64e44be470"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_09.41.38_e89edf/docugit-linux-amd64"
      sha256 "2e8576b9fb8bab259a4529a5d267c76ede3626b4f2a4ede922571d09dd340fcc"
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
