# Updated automatically by the Release workflow after each main-branch release.
# Install: brew tap xiaoheiCat/docugit https://github.com/xiaoheiCat/docugit && brew install docugit

class Docugit < Formula
  desc "Git-based version control for Office OpenXML documents"
  homepage "https://github.com/xiaoheiCat/docugit"
  version "2026.06.01_05.15.34_eb7c72"
  license "GPL-3.0"

  on_macos do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_05.15.34_eb7c72/docugit-darwin-arm64"
      sha256 "74b75c1c16cec116065990ee82d867ef9c30f709e57efc5072780d8ee80b3be2"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_05.15.34_eb7c72/docugit-darwin-amd64"
      sha256 "a44687de1356ac7083c029c48a5e0f9a1c4846ed2fa39d3309bd12911b3f07e9"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_05.15.34_eb7c72/docugit-linux-arm64"
      sha256 "2d415bc99229882b2fb1c567d8781fb32a927116b4ef234d8b0ce19858e5bd6d"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_05.15.34_eb7c72/docugit-linux-amd64"
      sha256 "7657ccc2f7bd2bafc555285273ff85a194b7274fade80eba4d9a3df599a966b7"
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
