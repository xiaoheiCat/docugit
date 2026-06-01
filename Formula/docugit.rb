# Updated automatically by the Release workflow after each main-branch release.
# Install: brew tap xiaoheiCat/docugit https://github.com/xiaoheiCat/docugit && brew install docugit

class Docugit < Formula
  desc "Git-based version control for Office OpenXML documents"
  homepage "https://github.com/xiaoheiCat/docugit"
  version "2026.06.01_10.40.00_dabb06"
  license "GPL-3.0"

  on_macos do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_10.40.00_dabb06/docugit-darwin-arm64"
      sha256 "ea600accffcb917500fd1378d7e7025f4a1d72f839009f0984c417e5e3320fc1"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_10.40.00_dabb06/docugit-darwin-amd64"
      sha256 "1cfd08f7cbfde5fe26c229530736e89581ac984217861da076e1ce8aa7303969"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_10.40.00_dabb06/docugit-linux-arm64"
      sha256 "2e9fba9468b1b0a3e551f6742ccac0702b1082c6f5a9b50e69f0733bcb8b224c"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_10.40.00_dabb06/docugit-linux-amd64"
      sha256 "f82481a0d2841758175882061036a4c639fa05c194fed6831d5475c3c27037db"
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
