# Updated automatically by the Release workflow after each main-branch release.
# Install: brew tap xiaoheiCat/docugit https://github.com/xiaoheiCat/docugit && brew install docugit

class Docugit < Formula
  desc "Git-based version control for Office OpenXML documents"
  homepage "https://github.com/xiaoheiCat/docugit"
  version "2026.06.02_14.10.22_8a4cf2"
  license "GPL-3.0"

  on_macos do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_14.10.22_8a4cf2/docugit-darwin-arm64"
      sha256 "040fb647cbb6cfa29e5edaf2be03dfc3660f5a90c8e284198ac60ed16d0d68a8"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_14.10.22_8a4cf2/docugit-darwin-amd64"
      sha256 "cee71d36766f7eef6847083c51bd15d88ff1a1bd4a79bceb67c1dac6e7a38e24"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_14.10.22_8a4cf2/docugit-linux-arm64"
      sha256 "b7db5d50936b66267e44267ca8c73ef600174e2e150933bec976f14ad708b2b1"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_14.10.22_8a4cf2/docugit-linux-amd64"
      sha256 "96d7dd291e2cd1c8cae4d1292c58db92b9b42bdeb11f74e670f9813d8f84aafd"
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
