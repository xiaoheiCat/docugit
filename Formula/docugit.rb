# Updated automatically by the Release workflow after each main-branch release.
# Install: brew tap xiaoheiCat/docugit https://github.com/xiaoheiCat/docugit && brew install docugit

class Docugit < Formula
  desc "Git-based version control for Office OpenXML documents"
  homepage "https://github.com/xiaoheiCat/docugit"
  version "2026.06.01_05.03.45_a8a51f"
  license "GPL-3.0"

  on_macos do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_05.03.45_a8a51f/docugit-darwin-arm64"
      sha256 "9f1e8830e25f235d4110c52115c72d9e205ce9a9f27de0ae460bbfa3425d7a70"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_05.03.45_a8a51f/docugit-darwin-amd64"
      sha256 "75aee5041cb97ef9ae1662b396c77e69bbfce9de15b3542b3321100ac70af1e1"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_05.03.45_a8a51f/docugit-linux-arm64"
      sha256 "381f2db2be2f9b1de8f1544c618641ec939235338bfde85037b27246e7424a00"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_05.03.45_a8a51f/docugit-linux-amd64"
      sha256 "4b3b8b5117496fe36355c051ba41afcb95c7101c304e31ad9b3f6f2e2d0e8164"
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
