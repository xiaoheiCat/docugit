# Updated automatically by the Release workflow after each main-branch release.
# Install: brew tap xiaoheiCat/docugit https://github.com/xiaoheiCat/docugit && brew install docugit

class Docugit < Formula
  desc "Git-based version control for Office OpenXML documents"
  homepage "https://github.com/xiaoheiCat/docugit"
  version "2026.06.01_06.53.50_7c5651"
  license "GPL-3.0"

  on_macos do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_06.53.50_7c5651/docugit-darwin-arm64"
      sha256 "8a8597b1e037ff0397cdc1a1aa3cae97fb6e24dc5cfa7191cdc598b1644ac7f5"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_06.53.50_7c5651/docugit-darwin-amd64"
      sha256 "aac472fe57afe608fbe643810091b3708fd1341f6a5c25637b3df5d11a7c1b0f"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_06.53.50_7c5651/docugit-linux-arm64"
      sha256 "b7f154442e1d93f5549f4495b2357d4dcaa60163fcff953ad6ff6fd237e84b1d"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_06.53.50_7c5651/docugit-linux-amd64"
      sha256 "883e9bbf66f81e2966256c1c63ac070c2833f85e4d2d4e92ae55407d6618f494"
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
