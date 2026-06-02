# Updated automatically by the Release workflow after each main-branch release.
# Install: brew tap xiaoheiCat/docugit https://github.com/xiaoheiCat/docugit && brew install docugit

class Docugit < Formula
  desc "Git-based version control for Office OpenXML documents"
  homepage "https://github.com/xiaoheiCat/docugit"
  version "2026.06.02_15.19.11_689e7d"
  license "GPL-3.0"

  on_macos do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_15.19.11_689e7d/docugit-darwin-arm64"
      sha256 "70c0fa9e011f4946ef907da39b63dbd5d1c1ed2b5b8ca16d86a25093c4ac1100"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_15.19.11_689e7d/docugit-darwin-amd64"
      sha256 "040ae7742fa4a3248f61362953126bc921e037743a5a67e6c4d1082b89824464"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_15.19.11_689e7d/docugit-linux-arm64"
      sha256 "ef52234e89d255b0d3ab9efe5dba1781ae669607fb27aba73c29dea9d959195d"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_15.19.11_689e7d/docugit-linux-amd64"
      sha256 "8432cce1956c834c1848916bb720e1e8dee744e8c78193eb687b84d7b5361767"
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
